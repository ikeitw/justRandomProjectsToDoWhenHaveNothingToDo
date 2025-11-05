import json
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
from providers.dns_tools import resolve_records, dns_health
from providers.whois_tools import whois_domain, whois_ip
from providers.ports import scan_common_ports, scan_custom_ports
from providers.subdomains import brute_subdomains
from providers.http_headers import fetch_headers

app = FastAPI(title="OSINT Recon (Reworked)", version="1.0.0")

BASE_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = BASE_DIR / "frontend"

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
def index():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/api/ping")
def ping():
    return {"ok": True, "app": "osint_recon", "version": "1.0.0"}

@app.get("/api/ipinfo")
def ipinfo(target: str = Query(..., description="IP or domain")):
    from ipaddress import ip_address, IPv4Address, IPv6Address
    import socket

    try:
        try:
            ip = ip_address(target)
        except ValueError:
            ip_str = socket.gethostbyname(target)
            ip = ip_address(ip_str)
        ip_str = str(ip)

        try:
            rev = socket.gethostbyaddr(ip_str)[0]
        except Exception:
            rev = None

        info = {
            "target": target,
            "ip": ip_str,
            "reverse_dns": rev,
            "is_private": ip.is_private,
            "is_loopback": ip.is_loopback,
            "is_multicast": ip.is_multicast,
            "is_reserved": ip.is_reserved,
            "is_global": ip.is_global,
            "version": 4 if isinstance(ip, IPv4Address) else 6,
        }

        ip_whois = whois_ip(ip_str)
        if ip_whois:
            info["whois"] = ip_whois

        return info
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ipinfo error: {e}")

@app.get("/api/dns_records")
def dns_records(domain: str, types: str = "A,AAAA,MX,NS,TXT,CNAME"):
    tps = [t.strip().upper() for t in types.split(",") if t.strip()]
    try:
        records = resolve_records(domain, tps)
        health = dns_health(domain)
        return {"domain": domain, "records": records, "health": health}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"dns error: {e}")

@app.get("/api/subdomains")
def subdomains(domain: str, limit: int = 100):
    try:
        subs = brute_subdomains(domain, max_results=limit)
        return {"domain": domain, "count": len(subs), "subdomains": subs}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"subdomain error: {e}")

@app.get("/api/scan_ports")
def scan_ports(host: str, mode: str = "common", ports: str | None = None, timeout_ms: int = 600):
    try:
        if mode == "common":
            results = scan_common_ports(host, timeout_ms=timeout_ms)
        else:
            if not ports:
                raise HTTPException(status_code=400, detail="Provide ports for custom mode, e.g. 22,80,443 or 1-1024")
            results = scan_custom_ports(host, ports, timeout_ms=timeout_ms)
        return {"host": host, "mode": mode, "results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"scan error: {e}")

@app.get("/api/http_headers")
def http_headers(url: str, method: str = "HEAD"):
    try:
        hdrs, status, final_url = fetch_headers(url, method=method)
        return {"url": url, "final_url": final_url, "status": status, "headers": hdrs}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"http error: {e}")

@app.post("/api/export")
async def export_report(payload: dict):
    exports_dir = FRONTEND_DIR / "exports"
    exports_dir.mkdir(exist_ok=True)
    file_path = exports_dir / "osint_report.json"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return {"ok": True, "download": "/static/exports/osint_report.json"}
