"""
F1 Live Timing Client
────────────────────
Connects to the official F1 SignalR timing hub at livetiming.formula1.com,
decodes compressed binary streams, and writes parsed data into AppState.

If no live session is detected (or the feed is unreachable), the client
automatically enters DEMO MODE: 20 simulated cars on an oval-ish track,
with realistic position updates, lap timing, and tyre data.

Architecture:
  • run_forever()  — async entry point; called from main.py startup
  • _connect()     — negotiates & maintains WebSocket session
  • _dispatch()    — routes each topic to the right AppState update
  • demo_loop()    — async generator for offline/test usage
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import math
import random
import time
import zlib
from typing import Any, Dict, List, Optional, Tuple

import httpx

from state import AppState, COMPOUND_COLOURS

logger = logging.getLogger(__name__)

# ── F1 Timing hub constants ────────────────────────────────────────────────────
_NEGOTIATE = "https://livetiming.formula1.com/signalr/negotiate"
_WS_BASE   = "wss://livetiming.formula1.com/signalr/connect"
_HUB       = "Streaming"

LIVE_TOPICS = [
    "DriverList",
    "TimingData",
    "TimingAppData",
    "CarData.z",
    "Position.z",
    "SessionInfo",
    "SessionStatus",
    "TrackStatus",
    "WeatherData",
    "LapCount",
]

# Headers that mirror an F1 app request so the server accepts us
_HEADERS = {
    "User-Agent":       "BestHTTP",
    "Accept-Encoding":  "gzip, identity",
    "Connection":       "keep-alive, Upgrade",
}


# ── Compression helpers ────────────────────────────────────────────────────────

def _decompress(data: str) -> Any:
    """Inflate the base-64 + zlib-deflate payloads used for *.z topics."""
    raw = base64.b64decode(data)
    return json.loads(zlib.decompress(raw, -zlib.MAX_WBITS).decode("utf-8"))


# ── Main client class ──────────────────────────────────────────────────────────

class F1LiveClient:
    """
    Async SignalR client for the F1 live timing feed.

    Usage (from an async context):
        client = F1LiveClient(state)
        await client.run_forever()          # blocks; reconnects automatically
    """

    def __init__(self, state: AppState) -> None:
        self.state = state
        self._running = False

    # ── Public entry point ─────────────────────────────────────────────────────

    async def run_forever(self) -> None:
        """
        Keep trying to connect to the live feed.
        If three consecutive attempts fail, fall through to demo mode.
        """
        self._running = True
        failures = 0

        while self._running:
            try:
                logger.info("Attempting F1 live feed connection …")
                await self._connect()
                failures = 0
            except Exception as exc:
                failures += 1
                logger.warning("Live feed error (%s). Attempt %d/3.", exc, failures)
                if failures >= 3:
                    logger.warning("Cannot reach live feed — starting DEMO MODE.")
                    await self._demo_loop()
                    return
                await asyncio.sleep(5)

    # ── SignalR negotiation & WebSocket session ────────────────────────────────

    async def _negotiate(self) -> Tuple[str, str]:
        params = {
            "connectionData": json.dumps([{"name": _HUB}]),
            "clientProtocol": "1.5",
        }
        async with httpx.AsyncClient(headers=_HEADERS, timeout=10) as client:
            r = await client.get(_NEGOTIATE, params=params)
            r.raise_for_status()
            data = r.json()
            token = data["ConnectionToken"]
            cookie = r.headers.get("set-cookie", "")
            return token, cookie

    async def _connect(self) -> None:
        import websockets  # local import so demo mode works without it

        token, cookie = await self._negotiate()

        params = {
            "transport":      "webSockets",
            "connectionToken": token,
            "connectionData": json.dumps([{"name": _HUB}]),
            "clientProtocol": "1.5",
        }
        from urllib.parse import urlencode
        ws_url = f"{_WS_BASE}?{urlencode(params)}"

        extra_headers = dict(_HEADERS)
        if cookie:
            extra_headers["Cookie"] = cookie

        async with websockets.connect(ws_url, extra_headers=extra_headers,
                                       ping_interval=20, ping_timeout=30) as ws:
            logger.info("Connected to F1 live timing hub.")

            # Subscribe to all topics
            sub_msg = json.dumps({
                "H": _HUB,
                "M": "Subscribe",
                "A": [LIVE_TOPICS],
                "I": 1,
            })
            await ws.send(sub_msg)

            # Receive loop
            async for raw in ws:
                try:
                    msg = json.loads(raw)
                    self._handle_message(msg)
                except Exception as exc:
                    logger.debug("Message parse error: %s", exc)

    # ── Message routing ────────────────────────────────────────────────────────

    def _handle_message(self, msg: dict) -> None:
        """Top-level SignalR envelope → individual topic dispatchers."""
        for item in msg.get("M", []):
            if item.get("H", "").lower() != _HUB.lower():
                continue
            if item.get("M") != "feed":
                continue
            args = item.get("A", [])
            if len(args) < 2:
                continue
            topic: str = args[0]
            data:  Any = args[1]
            self._dispatch(topic, data)

    def _dispatch(self, topic: str, data: Any) -> None:
        s = self.state
        try:
            if topic == "DriverList":
                for num, raw in data.items():
                    s.set_driver(num, raw)

            elif topic == "TimingData":
                for num, raw in data.get("Lines", {}).items():
                    s.set_timing(num, raw)

            elif topic == "TimingAppData":
                for num, raw in data.get("Lines", {}).items():
                    stints = raw.get("Stints", [])
                    if isinstance(stints, list) and stints:
                        s.set_tyre(num, stints[-1])
                    elif isinstance(stints, dict) and stints:
                        s.set_tyre(num, list(stints.values())[-1])

            elif topic == "Position.z":
                payload = _decompress(data) if isinstance(data, str) else data
                for frame in payload.get("Position", []):
                    for num, pos in frame.get("Entries", {}).items():
                        s.set_position(num, pos)

            elif topic == "CarData.z":
                payload = _decompress(data) if isinstance(data, str) else data
                for frame in payload.get("Entries", []):
                    for num, car in frame.get("Cars", {}).items():
                        channels = car.get("Channels", {})
                        speed = channels.get("4", 0)   # channel 4 = speed km/h
                        drs   = channels.get("45", 0)  # channel 45 = DRS
                        with s._lock:
                            t = s.timing.setdefault(num, __import__('state').TimingEntry())
                            t.speed = int(speed)
                            t.drs   = int(drs) > 0

            elif topic == "SessionInfo":
                with s._lock:
                    s.session_name = data.get("Meeting", {}).get("Name", s.session_name)
                    s.session_type = data.get("Name", s.session_type)

            elif topic == "SessionStatus":
                with s._lock:
                    s.session_status = data.get("Status", s.session_status)

            elif topic == "TrackStatus":
                with s._lock:
                    s.track_status = str(data.get("Status", s.track_status))

            elif topic == "WeatherData":
                with s._lock:
                    s.weather.update({
                        "AirTemp":    data.get("AirTemp",   s.weather["AirTemp"]),
                        "TrackTemp":  data.get("TrackTemp", s.weather["TrackTemp"]),
                        "WindSpeed":  data.get("WindSpeed", s.weather["WindSpeed"]),
                        "Humidity":   data.get("Humidity",  s.weather["Humidity"]),
                        "Rainfall":   data.get("Rainfall",  s.weather["Rainfall"]),
                    })

            elif topic == "LapCount":
                with s._lock:
                    s.lap_count  = int(data.get("CurrentLap",  s.lap_count))
                    s.total_laps = int(data.get("TotalLaps",   s.total_laps))

        except Exception as exc:
            logger.debug("Dispatch error for %s: %s", topic, exc)


# ── Demo mode ─────────────────────────────────────────────────────────────────

# 2025 grid
_DEMO_DRIVERS = [
    ("1",  "VER", "Max Verstappen",     "Red Bull Racing"),
    ("4",  "NOR", "Lando Norris",       "McLaren"),
    ("16", "LEC", "Charles Leclerc",    "Ferrari"),
    ("63", "RUS", "George Russell",     "Mercedes"),
    ("44", "HAM", "Lewis Hamilton",     "Ferrari"),
    ("81", "PIA", "Oscar Piastri",      "McLaren"),
    ("14", "ALO", "Fernando Alonso",    "Aston Martin"),
    ("55", "SAI", "Carlos Sainz",       "Williams"),
    ("22", "TSU", "Yuki Tsunoda",       "RB"),
    ("18", "STR", "Lance Stroll",       "Aston Martin"),
    ("10", "GAS", "Pierre Gasly",       "Alpine"),
    ("31", "OCO", "Esteban Ocon",       "Haas F1 Team"),
    ("23", "ALB", "Alexander Albon",    "Williams"),
    ("27", "HUL", "Nico Hulkenberg",    "Kick Sauber"),
    ("38", "BEA", "Oliver Bearman",     "Haas F1 Team"),
    ("87", "VDO", "Franco Colapinto",   "Alpine"),
    ("5",  "LAW", "Liam Lawson",        "RB"),
    ("30", "ANT", "Andrea Kimi Antonelli", "Mercedes"),
    ("6",  "HAD", "Isack Hadjar",       "RB"),
    ("7",  "DOO", "Jack Doohan",        "Alpine"),
]

_COMPOUNDS = ["SOFT", "MEDIUM", "HARD"]


def _make_oval(n_points: int = 600,
               rx: float = 3_500_000,
               ry: float = 1_800_000) -> List[Tuple[float, float]]:
    """Synthesise a rough oval track (coordinates in F1's mm units)."""
    pts: List[Tuple[float, float]] = []
    for i in range(n_points):
        a  = 2 * math.pi * i / n_points
        # Add some chicane-like wobble so the track looks real
        wobble_x = math.sin(5 * a) * 150_000
        wobble_y = math.cos(7 * a) * 80_000
        x = rx * math.cos(a) + wobble_x
        y = ry * math.sin(a) + wobble_y
        pts.append((x, y))
    return pts


def _fmt_laptime(seconds: float) -> str:
    m  = int(seconds // 60)
    s  = seconds % 60
    return f"{m}:{s:06.3f}"


async def _demo_loop(self: "F1LiveClient") -> None:
    """Fake a full race with 20 cars driving around a synthetic oval."""
    s = self.state
    s.demo_mode      = True
    s.session_name   = "Demo Grand Prix"
    s.session_type   = "Race"
    s.session_status = "Started"
    s.track_status   = "1"
    s.lap_count      = 1
    s.total_laps     = 57
    s.weather = {
        "AirTemp": "27", "TrackTemp": "38",
        "WindSpeed": "1.8", "Humidity": "52",
        "Rainfall": False,
    }

    track = _make_oval()
    s.set_preloaded_track(track)
    n_track = len(track)

    # Seed drivers
    for num, abbr, full, team in _DEMO_DRIVERS:
        s.set_driver(num, {
            "RacingNumber": num,
            "Tla": abbr,
            "FullName": full,
            "TeamName": team,
            "TeamColour": "",
        })

    base_lap_time = 90.0   # seconds

    # Per-car state
    offsets      = [i * (n_track // 20) for i in range(20)]
    lap_times    = [base_lap_time + random.uniform(-2, 5) for _ in _DEMO_DRIVERS]
    laps_done    = [0] * 20
    compounds    = [random.choice(_COMPOUNDS) for _ in _DEMO_DRIVERS]
    tyre_ages    = [random.randint(0, 8) for _ in _DEMO_DRIVERS]
    last_update  = time.time()
    positions    = list(range(1, 21))  # race order

    tick = 0
    while self._running:
        now   = time.time()
        dt    = now - last_update
        last_update = now

        # Advance each car along the track
        for i, (num, *_) in enumerate(_DEMO_DRIVERS):
            speed = n_track / lap_times[i]      # track-points per second
            offsets[i] = (offsets[i] + speed * dt) % n_track
            idx = int(offsets[i])
            x, y = track[idx]

            s.set_position(num, {
                "X": x + random.uniform(-30_000, 30_000),
                "Y": y + random.uniform(-30_000, 30_000),
                "Z": 0,
                "Status": 1,
            })

            # Crude lap detection (crossed index 0)
            prev_idx = int((offsets[i] - speed * dt) % n_track)
            if prev_idx > idx and tick > 0:
                laps_done[i] += 1
                tyre_ages[i] += 1

            # Build timing entry
            gap = (positions[i] - 1) * random.uniform(2.5, 4.5) if positions[i] > 1 else 0
            s1  = base_lap_time * 0.27 + random.uniform(-0.4, 0.4)
            s2  = base_lap_time * 0.38 + random.uniform(-0.4, 0.4)
            s3  = base_lap_time * 0.35 + random.uniform(-0.3, 0.3)
            lt  = s1 + s2 + s3

            s.set_timing(num, {
                "Line":            positions[i],
                "GapToLeader":     f"+{gap:.3f}" if gap else "",
                "IntervalToPositionAhead": {"Value": f"+{random.uniform(0.3, 8):.3f}"},
                "LastLapTime":     {"Value": _fmt_laptime(lt)},
                "BestLapTime":     {"Value": _fmt_laptime(lt - random.uniform(0, 0.5))},
                "NumberOfLaps":    laps_done[i],
                "Sectors": [
                    {"Value": f"{s1:.3f}", "PersonalFastest": random.random() < 0.1},
                    {"Value": f"{s2:.3f}", "OverallFastest":  random.random() < 0.05},
                    {"Value": f"{s3:.3f}", "PersonalFastest": random.random() < 0.1},
                ],
                "DRS": random.random() < 0.3,
            })
            s.set_tyre(num, {
                "Compound":    compounds[i],
                "TotalLaps":   tyre_ages[i],
                "StintNumber": 1,
            })

        with s._lock:
            s.lap_count = max(laps_done) if max(laps_done) > 0 else 1

        tick += 1
        await asyncio.sleep(0.1)


# Bind the demo loop as a method so it shares `self`
F1LiveClient._demo_loop = _demo_loop  # type: ignore