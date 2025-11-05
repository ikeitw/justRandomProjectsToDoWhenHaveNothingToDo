import socket
import asyncio
from contextlib import closing

COMMON_PORTS = [
    21,22,23,25,53,67,68,80,110,123,135,139,143,161,162,389,443,445,465,587,636,853,
    990,993,995,1433,1521,1723,2049,2375,2376,27017,3000,3128,3306,3389,4080,4444,
    5000,5432,5601,5900,5985,5986,6379,6443,6667,7001,7002,7007,7199,7447,8000,8008,
    8080,8081,8088,8181,8443,8888,9000,9001,9002,9090,9200,9300,9418,9443,11211
]

def _probe_sync(host: str, port: int, timeout_ms: int = 600) -> bool:
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        s.settimeout(timeout_ms / 1000.0)
        try:
            s.connect((host, port))
            return True
        except Exception:
            return False

async def _probe_async(host: str, port: int, timeout_ms: int):
    loop = asyncio.get_event_loop()
    return port if await loop.run_in_executor(None, _probe_sync, host, port, timeout_ms) else None

def scan_common_ports(host: str, timeout_ms: int = 600):
    return scan_custom_ports(host, ",".join(map(str, COMMON_PORTS)), timeout_ms)

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

def scan_custom_ports(host: str, ports: str, timeout_ms: int = 600):
    port_list = parse_ports(ports)
    async def runner():
        tasks = [_probe_async(host, p, timeout_ms) for p in port_list]
        results = await asyncio.gather(*tasks)
        open_ports = [p for p in results if p]
        return [{"port": p, "status": "open"} for p in open_ports]
    return asyncio.run(runner())
