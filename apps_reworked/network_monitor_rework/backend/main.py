from __future__ import annotations
import asyncio
import collections
import ipaddress
import socket
import threading
import time
from pathlib import Path
from typing import Any, Deque, Dict, List, Tuple, Optional
import psutil
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from scapy.all import sniff, IP, IPv6, TCP, UDP, Raw  # type: ignore

app = FastAPI(title="NetGlass (Sniffer Mode)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

_here = Path(__file__).parent
_frontend = (_here.parent / "frontend").absolute()
if _frontend.exists():
    app.mount("/static", StaticFiles(directory=str(_frontend)), name="static")

# =======================
# Rolling store (24 hours)
# =======================

Point = Tuple[int, float, float]
GLOBAL_SERIES: Deque[Point] = collections.deque(maxlen=24 * 60 * 60)

Event = Tuple[int, int, str, int, int]
APP_EVENTS: Deque[Event] = collections.deque(maxlen=600_000)

_live_up_total = 0
_live_down_total = 0
_live_up_pid: Dict[int, int] = collections.defaultdict(int)
_live_down_pid: Dict[int, int] = collections.defaultdict(int)

PROC_NAME: Dict[int, str] = {}
LOCAL_IPS: set[str] = set()
CONN_INDEX = {}
CONN_LOCK = threading.Lock()

# -----------------
# Helper functions
# -----------------
def _safe_proc_name(pid: int) -> str:
    if pid in PROC_NAME:
        return PROC_NAME[pid]
    name = "unknown"
    try:
        p = psutil.Process(pid)
        name = p.name() or (p.exe().split("\\")[-1] if p.exe() else "unknown")
    except Exception:
        pass
    PROC_NAME[pid] = name
    return name

def _update_local_ips():
    ips = set()
    for ifname, addrs in psutil.net_if_addrs().items():
        for a in addrs:
            if a.family in (socket.AF_INET, socket.AF_INET6):
                try:
                    ipaddress.ip_address(a.address)
                    ips.add(a.address)
                except Exception:
                    pass
    return ips

def _rebuild_conn_index():
    """
    Build a mapping:
      (lip, lport, rip, rport, proto) -> pid
    for established and recent connections.
    """
    idx = {}
    for kind in ("tcp", "udp"):
        for c in psutil.net_connections(kind=kind):
            try:
                if not c.pid:
                    continue
                laddr = getattr(c, "laddr", None)
                raddr = getattr(c, "raddr", None)
                if not laddr:
                    continue
                lip, lport = laddr.ip, laddr.port
                proto = "TCP" if c.type == socket.SOCK_STREAM else "UDP"
                if raddr and raddr.ip:
                    rip, rport = raddr.ip, raddr.port
                else:
                    rip, rport = "", 0
                idx[(lip, lport, rip, rport, proto)] = c.pid
            except Exception:
                continue
    with CONN_LOCK:
        CONN_INDEX.clear()
        CONN_INDEX.update(idx)

# -----------------------
# Sniffer & attribution
# -----------------------
def _packet_pid(packet) -> Optional[int]:
    """
    Attribute packet to a PID using the current CONN_INDEX.
    Try exact 5-tuple; then fallbacks (local-port keyed), then None.
    """
    try:
        is_v4 = IP in packet
        is_v6 = IPv6 in packet
        if not (is_v4 or is_v6):
            return None

        if is_v4:
            src = packet[IP].src
            dst = packet[IP].dst
            proto_num = packet[IP].proto
        else:
            src = packet[IPv6].src
            dst = packet[IPv6].dst
            proto_num = packet[IPv6].nh

        if TCP in packet:
            sport = packet[TCP].sport
            dport = packet[TCP].dport
            proto = "TCP"
        elif UDP in packet:
            sport = packet[UDP].sport
            dport = packet[UDP].dport
            proto = "UDP"
        else:
            return None

        with CONN_LOCK:
            pid = CONN_INDEX.get((src, sport, dst, dport, proto))
            if pid:
                return pid
            pid = CONN_INDEX.get((dst, dport, src, sport, proto))
            if pid:
                return pid
            pid = CONN_INDEX.get((src, sport, "", 0, proto))
            if pid:
                return pid
            pid = CONN_INDEX.get((dst, dport, "", 0, proto))
            if pid:
                return pid
        return None
    except Exception:
        return None

def _is_outbound(packet) -> Optional[bool]:
    try:
        ip = packet[IP] if IP in packet else packet[IPv6]
        src, dst = ip.src, ip.dst
        if src in LOCAL_IPS and dst not in LOCAL_IPS:
            return True
        if dst in LOCAL_IPS and src not in LOCAL_IPS:
            return False
        return None
    except Exception:
        return None

def _sniffer():
    bpf = "ip and (tcp or udp) or (ip6 and (tcp or udp))"
    sniff(store=False, prn=_on_packet, filter=bpf)

def _on_packet(pkt):
    global _live_up_total, _live_down_total

    pid = _packet_pid(pkt)
    if pid is None:
        return

    try:
        size = int(pkt.wirelen)
    except Exception:
        try:
            size = len(bytes(pkt))
        except Exception:
            size = 0
    if size <= 0:
        return

    direction = _is_outbound(pkt)
    if direction is True:
        _live_up_total += size
        _live_up_pid[pid] += size
    elif direction is False:
        _live_down_total += size
        _live_down_pid[pid] += size
    else:
        return

# -----------------------
# Aggregator + Hub (WS)
# -----------------------
class Hub:
    def __init__(self):
        self.clients: List[asyncio.Queue] = []
        self.lock = asyncio.Lock()

hub = Hub()

async def _broadcast(payload: Dict[str, Any]):
    async with hub.lock:
        for q in list(hub.clients):
            try:
                q.put_nowait(payload)
            except Exception:
                pass

async def aggregator_task():
    """
    Every 1s:
      - convert live bytes → bps
      - append to GLOBAL_SERIES
      - emit APP_EVENTS (bytes) per PID
      - reset accumulators
      - broadcast last point
    Also refreshes LOCAL_IPS and connection index every 2s.
    """
    global _live_up_total, _live_down_total
    last = time.time()
    t0 = last
    tick = 0
    while True:
        await asyncio.sleep(1.0)
        now = time.time()
        dt = max(1.0, now - last)

        up_bps = (_live_up_total * 8.0) / dt
        dn_bps = (_live_down_total * 8.0) / dt
        ts = int(now * 1000)
        GLOBAL_SERIES.append((ts, up_bps, dn_bps))

        for pid, b in list(_live_up_pid.items()):
            if b > 0:
                APP_EVENTS.append((ts, pid, _safe_proc_name(pid), b, 0))
        for pid, b in list(_live_down_pid.items()):
            if b > 0:
                APP_EVENTS.append((ts, pid, _safe_proc_name(pid), 0, b))

        _live_up_total = 0
        _live_down_total = 0
        _live_up_pid.clear()
        _live_down_pid.clear()
        last = now

        await _broadcast({"ts": ts, "up_bps": up_bps, "down_bps": dn_bps})

        tick += 1
        if tick % 2 == 0:
            try:
                ips = _update_local_ips()
                LOCAL_IPS.clear()
                LOCAL_IPS.update(ips)
            except Exception:
                pass
            try:
                _rebuild_conn_index()
            except Exception:
                pass

@app.on_event("startup")
async def _startup():
    try:
        ips = _update_local_ips()
        LOCAL_IPS.update(ips)
        _rebuild_conn_index()
    except Exception:
        pass

    t = threading.Thread(target=_sniffer, name="sniffer", daemon=True)
    t.start()

    asyncio.create_task(aggregator_task())

# -------------
# Query helpers
# -------------
def _now_ms() -> int:
    return int(time.time() * 1000)

def _clip_series(window_s: int) -> List[Point]:
    cutoff = _now_ms() - window_s * 1000
    return [p for p in GLOBAL_SERIES if p[0] >= cutoff]

def _summarize_apps(window_s: int, top_k: int = 20) -> List[Dict[str, Any]]:
    cutoff = _now_ms() - window_s * 1000
    agg: Dict[int, Dict[str, Any]] = {}
    for ts, pid, exe, up_b, down_b in APP_EVENTS:
        if ts < cutoff:
            continue
        d = agg.setdefault(pid, {"pid": pid, "name": exe, "up": 0, "down": 0})
        d["up"] += up_b
        d["down"] += down_b
    items = list(agg.values())
    for v in items:
        v["total"] = v["up"] + v["down"]
    items.sort(key=lambda x: x["total"], reverse=True)
    return items[:top_k]

# -------------
# Endpoints / WS
# -------------
@app.websocket("/ws/ticks")
async def ws_ticks(ws: WebSocket):
    await ws.accept()
    q: asyncio.Queue = asyncio.Queue()
    async with hub.lock:
        hub.clients.append(q)
    try:
        if GLOBAL_SERIES:
            ts, up, down = GLOBAL_SERIES[-1]
            await ws.send_json({"ts": ts, "up_bps": up, "down_bps": down})
        while True:
            payload = await q.get()
            await ws.send_json(payload)
    except WebSocketDisconnect:
        pass
    finally:
        async with hub.lock:
            if q in hub.clients:
                hub.clients.remove(q)

@app.get("/series")
def series(window: int = Query(..., ge=1, le=86400)):
    arr = _clip_series(window)
    return [{"ts": ts, "up_bps": up, "down_bps": down} for (ts, up, down) in arr]

@app.get("/summary")
def summary(window: int = Query(..., ge=1, le=86400), top: int = Query(15, ge=1, le=50)):
    arr = _clip_series(window)
    up_bytes = sum(p[1] for p in arr) / 8.0
    dn_bytes = sum(p[2] for p in arr) / 8.0
    apps = _summarize_apps(window, top)
    return {"window": window, "totals": {"up_bytes": up_bytes, "down_bytes": dn_bytes}, "apps": apps}

@app.get("/")
def index():
    idx = _frontend / "index.html"
    if idx.exists():
        return HTMLResponse(idx.read_text(encoding="utf-8", errors="ignore"))
    return HTMLResponse("<h1>NetGlass</h1><p>Put frontend in ./frontend</p>")
