# backend/providers/ports.py
import socket
import ssl
import asyncio
from contextlib import closing

COMMON_PORTS = [
    21,22,23,25,53,67,68,80,110,123,135,139,143,161,162,389,443,445,465,587,636,853,
    990,993,995,1433,1521,1723,2049,2375,2376,27017,3000,3128,3306,3389,4080,4444,
    5000,5432,5601,5900,5985,5986,6379,6443,6667,7001,7002,7007,7199,7447,8000,8008,
    8080,8081,8088,8181,8443,8888,9000,9001,9002,9090,9200,9300,9418,9443,11211
]

UDP_MINI = [53, 123, 161, 500, 1900]  # DNS, NTP, SNMP, IKE, SSDP (best-effort/noisy)

def _probe_sync_tcp(host: str, port: int, timeout_ms: int = 600, banner: bool = False, alpn: bool = False):
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        s.settimeout(timeout_ms / 1000.0)
        try:
            s.connect((host, port))
            result = {"port": port, "status": "open", "protocol": "tcp", "banner": None, "service_hint": None, "alpn": None}
            if banner:
                try:
                    s.settimeout(0.6)
                    data = s.recv(1024)
                    if data:
                        result["banner"] = data.decode(errors="ignore").strip()
                except Exception:
                    pass
            # simple service hint
            if port in (80, 8000, 8080): result["service_hint"] = "http"
            elif port in (443, 8443): result["service_hint"] = "https"
            elif port == 22: result["service_hint"] = "ssh"
            elif port == 3306: result["service_hint"] = "mysql"
            elif port == 5432: result["service_hint"] = "postgresql"
            elif port == 3389: result["service_hint"] = "rdp"
            # ALPN attempt for TLS ports
            if alpn and port in (443, 8443):
                try:
                    ctx = ssl.create_default_context()
                    ctx.set_alpn_protocols(["h2", "http/1.1"])
                    with ctx.wrap_socket(s, server_hostname=host) as tls:
                        result["alpn"] = tls.selected_alpn_protocol()
                except Exception:
                    pass
            return result
        except Exception:
            return None

def _probe_sync_udp(host: str, port: int, timeout_ms: int = 600):
    with closing(socket.socket(socket.AF_INET, socket.SOCK_DGRAM)) as s:
        s.settimeout(timeout_ms / 1000.0)
        try:
            # Send tiny, protocol-safe probes (best-effort; avoid amplification)
            if port == 53:
                s.sendto(b"\x12\x34\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00\x01\x00", (host, port))
            elif port == 123:
                s.sendto(b"\x1b" + 47*b"\0", (host, port))
            elif port == 161:
                s.sendto(b"\x30\x26\x02\x01\x01\x04\x06public\xa0\x19\x02\x04\x00\x00\x00\x00\x02\x01\x00\x02\x01\x00\x30\x0b\x30\x09\x06\x05\x2b\x06\x01\x02\x01\x05\x00", (host, port))
            elif port == 500:
                s.sendto(b"\x00"*28, (host, port))
            elif port == 1900:
                s.sendto(b"M-SEARCH * HTTP/1.1\r\nST:ssdp:all\r\nMAN:\"ssdp:discover\"\r\nMX:1\r\n\r\n", (host, port))
            else:
                s.sendto(b"\x00", (host, port))
            s.recvfrom(512)
            return {"port": port, "status": "open", "protocol": "udp"}
        except Exception:
            return None

async def _probe_async_tcp(host: str, port: int, timeout_ms: int, banner: bool, alpn: bool):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _probe_sync_tcp, host, port, timeout_ms, banner, alpn)

async def _probe_async_udp(host: str, port: int, timeout_ms: int):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _probe_sync_udp, host, port, timeout_ms)

def parse_ports(ports: str) -> list[int]:
    out = set()
    for part in ports.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            a, b = part.split("-", 1)
            a, b = int(a), int(b)
            for p in range(min(a, b), max(a, b) + 1):
                out.add(p)
        else:
            out.add(int(part))
    return sorted(out)

def scan_custom_ports(host: str, ports: str, timeout_ms: int = 600, banner: bool = False, concurrency: int = 200, alpn: bool = False, udp: bool = False):
    port_list = parse_ports(ports)
    async def runner():
        sem = asyncio.Semaphore(concurrency)
        async def sem_tcp(p):
            async with sem:
                return await _probe_async_tcp(host, p, timeout_ms, banner, alpn)
        tasks = [sem_tcp(p) for p in port_list]
        results = await asyncio.gather(*tasks)
        open_ports = [r for r in results if r]
        # UDP optional mini-scan on known ports
        if udp:
            async def sem_udp(p):
                async with sem:
                    return await _probe_async_udp(host, p, timeout_ms)
            udp_tasks = [sem_udp(p) for p in UDP_MINI]
            udp_results = await asyncio.gather(*udp_tasks)
            open_ports += [r for r in udp_results if r]
        return open_ports
    return asyncio.run(runner())

def scan_common_ports(host: str, timeout_ms: int = 600, banner: bool = False, concurrency: int = 200, alpn: bool = False, udp: bool = False):
    ports = ",".join(map(str, COMMON_PORTS))
    return scan_custom_ports(host, ports, timeout_ms=timeout_ms, banner=banner, concurrency=concurrency, alpn=alpn, udp=udp)
