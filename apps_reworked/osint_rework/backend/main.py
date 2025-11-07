import json
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from .providers.dns_tools import resolve_records, dns_health, get_spf, get_dmarc, attempt_axfr, get_caa, ptr_for_addresses
from .providers.whois_tools import whois_domain, whois_ip
from .providers.ports import scan_common_ports, scan_custom_ports
from .providers.subdomains import discover
from .providers.http_headers import fetch_headers
import socket
import time
import os
from datetime import datetime
import zipfile
from urllib.parse import urlparse
from typing import Optional
from .pentest import param_fuzz, js_scanner, dir_bruteforce, waf_detector, cors_checker, open_redirect, xss_probe, sqli_probe, ssrf_checker, auth_fingerprinter, api_scanner, robots_analyzer, favicon_hash, tls_checker, error_analyzer, session_analyzer, file_upload_tester, csp_analyzer, summary

app = FastAPI(title="OSINT Recon (Reworked)", version="1.2.0")

BASE_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = BASE_DIR / "frontend"

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

def _is_domain(s: str) -> bool:
    try:
        return "." in s and " " not in s and not s.startswith(("http://", "https://"))
    except Exception:
        return False

def _host_from_target(target: str) -> str:
    if target.startswith(("http://", "https://")):
        return urlparse(target).netloc.split("/")[0]
    return target

@app.get("/")
def index():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/api/ping")
def ping():
    return {"ok": True, "app": "osint_recon", "version": "1.2.0"}

@app.get("/api/ipinfo")
def ipinfo(target: str = Query(..., description="IP or domain")):
    from ipaddress import ip_address, IPv4Address, IPv6Address

    try:
        host = _host_from_target(target)
        try:
            ip = ip_address(host)
        except ValueError:
            ip_str = socket.gethostbyname(host)
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
def dns_records(
    domain: str,
    types: str = "A,AAAA,MX,NS,TXT,CNAME",
    axfr: bool = False,
    ttl: bool = True,
    caa: bool = True,
    ptr: bool = True,
    doh: bool = False
):
    try:
        if not _is_domain(domain):
            raise HTTPException(400, "Provide a valid domain (no scheme).")
        tps = [t.strip().upper() for t in types.split(",") if t.strip()]
        records = resolve_records(domain, tps, want_ttl=ttl, use_doh=doh)
        health = dns_health(domain, use_doh=doh)
        spf = get_spf(domain, use_doh=doh)
        dmarc = get_dmarc(domain, use_doh=doh)
        caa_records = get_caa(domain, use_doh=doh) if caa else []
        axfr_results = {}
        if axfr and records.get("NS"):
            for ns in records["NS"]:
                ns_val = ns["value"] if isinstance(ns, dict) else ns
                ax = attempt_axfr(ns_val, domain)
                if ax:
                    axfr_results[ns_val] = ax
        ptr_map = {}
        if ptr:
            a_items = (records.get("A") or [])
            aaaa_items = (records.get("AAAA") or [])
            ptr_map.update(ptr_for_addresses(a_items))
            ptr_map.update(ptr_for_addresses(aaaa_items))
        return {
            "domain": domain,
            "records": records,
            "health": health,
            "spf": spf,
            "dmarc": dmarc,
            "caa": caa_records,
            "ptr": ptr_map,
            "doh_used": bool(doh),
            "axfr": axfr_results
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"dns error: {e}")

@app.get("/api/subdomains")
def subdomains(
    domain: str,
    limit: int = 200,
    sources: str = "brute,crtsh",
    ipv6: bool = True,
    liveness: bool = False,
    wildcard: bool = True
):
    try:
        if not _is_domain(domain):
            raise HTTPException(400, "Provide a valid domain.")
        use_crtsh = "crtsh" in [s.strip() for s in sources.split(",")]
        subs = discover(
            domain,
            max_results=limit,
            use_crtsh=use_crtsh,
            want_ipv6=ipv6,
            check_liveness=liveness,
            detect_wildcard=wildcard
        )
        return {"domain": domain, "count": len(subs), "subdomains": subs}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"subdomain error: {e}")

@app.get("/api/scan_ports")
def scan_ports(
    host: str,
    mode: str = "common",
    ports: Optional[str] = None,
    timeout_ms: int = 700,
    banner: bool = False,
    concurrency: int = 200,
    alpn: bool = False,
    udp: bool = False
):
    try:
        if mode == "common":
            results = scan_common_ports(host, timeout_ms=timeout_ms, banner=banner, concurrency=concurrency, alpn=alpn, udp=udp)
        else:
            if not ports:
                raise HTTPException(status_code=400, detail="Provide ports for custom mode, e.g. 22,80,443 or 1-1024")
            results = scan_custom_ports(host, ports, timeout_ms=timeout_ms, banner=banner, concurrency=concurrency, alpn=alpn, udp=udp)
        return {"host": host, "mode": mode, "results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"scan error: {e}")

@app.get("/api/http_headers")
def http_headers(
    url: str,
    method: str = "HEAD",
    fetch_html: bool = False,
    robots: bool = False,
    sitemap: bool = False,
    redirect_chain: bool = True,
    cookie_inspect: bool = True,
    csp_analyze: bool = True
):
    try:
        hdrs, status, final_url, extras = fetch_headers(
            url,
            method=method,
            fetch_html=fetch_html,
            robots=robots,
            sitemap=sitemap,
            redirect_chain=redirect_chain,
            cookie_inspect=cookie_inspect,
            csp_analyze=csp_analyze
        )
        return {"url": url, "final_url": final_url, "status": status, "headers": hdrs, "extras": extras}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"http error: {e}")

def _redact(data: dict):
    import re
    s = json.dumps(data, ensure_ascii=False)
    s = re.sub(r"\b\d{1,3}(?:\.\d{1,3}){3}\b", "[REDACTED_IP]", s)
    s = re.sub(r"\b[\w\.-]+@[\w\.-]+\.\w+\b", "[REDACTED_EMAIL]", s)
    return json.loads(s)

@app.post("/api/export")
async def export_report(
    payload: dict = Body(...),
    format: str = Query("json", regex="^(json|zip|md|html)$"),
    include_html: bool = Query(False),
    project: Optional[str] = Query(None),
    redact: bool = Query(False)
):
    exports_dir = FRONTEND_DIR / "exports"
    exports_dir.mkdir(exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    base = (project.strip().replace(" ", "_") if project else "osint_report") + f"_{ts}"

    data = _redact(payload) if redact else payload

    def _write_json():
        file_path = exports_dir / f"{base}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return file_path

    def _write_md():
        file_path = exports_dir / f"{base}.md"
        with open(file_path, "w", encoding="utf-8") as f:
            tgt = data.get("target","")
            f.write(f"# OSINT Report — {tgt}\n\n")
            f.write(f"_Generated: {ts} UTC_\n\n")
            for k, v in (data.get("results") or {}).items():
                f.write(f"## {k}\n\n```\n{json.dumps(v, indent=2, ensure_ascii=False)}\n```\n\n")
        return file_path

    def _write_html():
        file_path = exports_dir / f"{base}.html"
        tgt = data.get("target","")
        body = [f"<h1>OSINT Report — {tgt}</h1><p><em>Generated: {ts} UTC</em></p>"]
        for k, v in (data.get("results") or {}).items():
            body.append(f"<h2>{k}</h2><pre>{json.dumps(v, indent=2, ensure_ascii=False)}</pre>")
        html = f"<!doctype html><html><head><meta charset='utf-8'><title>OSINT {tgt}</title></head><body>{''.join(body)}</body></html>"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(html)
        return file_path

    if format == "json":
        p = _write_json()
        return {"ok": True, "download": f"/static/exports/{p.name}"}
    elif format == "md":
        p = _write_md()
        return {"ok": True, "download": f"/static/exports/{p.name}"}
    elif format == "html":
        p = _write_html()
        return {"ok": True, "download": f"/static/exports/{p.name}"}
    elif format == "zip":
        json_path = _write_json()
        zip_name = f"{base}.zip"
        zip_path = exports_dir / zip_name
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.write(json_path, arcname=json_path.name)
            if include_html:
                try:
                    import requests
                    t = data.get("target")
                    if t:
                        u = t if t.startswith(("http://","https://")) else "http://" + t
                        r = requests.get(u, timeout=7)
                        if r.status_code == 200:
                            html_name = f"{base}_snapshot.html"
                            html_path = exports_dir / html_name
                            with open(html_path, "w", encoding="utf-8") as hf:
                                hf.write(r.text)
                            zf.write(html_path, arcname=html_name)
                            try: os.remove(html_path)
                            except Exception: pass
                except Exception:
                    pass
        try: os.remove(json_path)
        except Exception: pass
        return {"ok": True, "download": f"/static/exports/{zip_path.name}"}

@app.get("/api/pentest/param_probe")
def pentest_param_probe(target: str, params: str = "", timeout: int = 6):
    plist = params.split(",") if params else None
    return {"target": target, "findings": param_fuzz.probe_params(target, params=plist, timeout=timeout)}

@app.get("/api/pentest/js_scan")
def pentest_js_scan(target: str, timeout: int = 6):
    js = js_scanner.find_js_files(target, timeout=timeout)
    details = [js_scanner.scan_js_for_indicators(u, timeout=timeout) for u in js]
    return {"target": target, "js_files": js, "details": details}

@app.get("/api/pentest/dir_brute")
def pentest_dir_brute(target: str, timeout: int = 6):
    return {"target": target, "results": dir_bruteforce.brute_dirs(target, timeout=timeout)}

@app.get("/api/pentest/waf_detect")
def pentest_waf_detect(target: str, timeout: int = 6):
    import requests
    base = target if target.startswith(("http://","https://")) else "http://" + target
    try:
        r = requests.head(base, timeout=timeout, allow_redirects=True)
        headers = dict(r.headers)
        body = (r.text or "")[:2000] if hasattr(r, "text") else None
    except Exception:
        headers = {}
        body = None
    return {"target": target, "waf": waf_detector.detect_waf(headers, body)}

@app.get("/api/pentest/cors")
def pentest_cors(target: str, timeout: int = 6):
    return {"target": target, "cors": cors_checker.check_cors(target, timeout=timeout)}

@app.get("/api/pentest/open_redirect")
def pentest_open_redirect(target: str, timeout: int = 6):
    return {"target": target, "redirect_checks": open_redirect.find_redirect_params(target, timeout=timeout)}

@app.get("/api/pentest/xss_probe")
def pentest_xss(target: str, param: str = "q", timeout: int = 6):
    return {"target": target, "xss": xss_probe.probe_xss(target, param=param, timeout=timeout)}

@app.get("/api/pentest/sqli_probe")
def pentest_sqli(target: str, param: str = "id", timeout: int = 6):
    return {"target": target, "sqli": sqli_probe.probe_sqli(target, param=param, timeout=timeout)}

@app.get("/api/pentest/ssrf_probe")
def pentest_ssrf(target: str, param: str = "url", timeout: int = 6):
    return {"target": target, "ssrf": ssrf_checker.probe_ssrf(target, param=param, timeout=timeout)}

@app.get("/api/pentest/auth_find")
def pentest_auth_find(target: str, timeout: int = 6):
    return {"target": target, "auth": auth_fingerprinter.detect_login_forms(target, timeout=timeout)}

@app.get("/api/pentest/api_discover")
def pentest_api_discover(target: str, timeout: int = 6):
    return {"target": target, "api": api_scanner.discover_api_endpoints(target, timeout=timeout)}

@app.get("/api/pentest/robots_analysis")
def pentest_robots(target: str, timeout: int = 6):
    return {"target": target, "robots": robots_analyzer.analyze_robots(target, timeout=timeout)}

@app.get("/api/pentest/favicon")
def pentest_favicon(target: str, timeout: int = 6):
    return {"target": target, "favicon": favicon_hash.favicon_hash(target, timeout=timeout)}

@app.get("/api/pentest/tls_info")
def pentest_tls(target: str, port: int = 443, timeout: int = 5):
    host = target if not target.startswith(("http://","https://")) else urlparse(target).netloc.split(":")[0]
    return {"target": target, "tls": tls_checker.tls_info(host, port=port, timeout=timeout)}

@app.get("/api/pentest/error_analysis")
def pentest_error_analysis(target: str, timeout: int = 6):
    return {"target": target, "errors": error_analyzer.analyze_errors(target, timeout=timeout)}

@app.get("/api/pentest/session")
def pentest_session(target: str, timeout: int = 6):
    return {"target": target, "cookies": session_analyzer.analyze_cookies(target, timeout=timeout)}

@app.get("/api/pentest/upload_forms")
def pentest_upload_forms(target: str, timeout: int = 6):
    return {"target": target, "uploads": file_upload_tester.detect_upload_forms(target, timeout=timeout)}

@app.get("/api/pentest/csp")
def pentest_csp(target: str, timeout: int = 6):
    import requests
    base = target if target.startswith(("http://","https://")) else "http://" + target
    try:
        r = requests.head(base, timeout=timeout, allow_redirects=True)
        csp = r.headers.get("Content-Security-Policy")
    except Exception:
        csp = None
    return {"target": target, "csp": csp_analyzer.analyze_csp(csp)}

@app.get("/api/pentest/summary")
def pentest_summary(target: str, timeout: int = 6):
    res = {}
    res["cors"] = cors_checker.check_cors(target, timeout=timeout)
    import requests
    try:
        r = requests.head(target if target.startswith(("http://","https://")) else "http://" + target, timeout=timeout, allow_redirects=True)
        headers = dict(r.headers)
    except Exception:
        headers = {}
    res["waf"] = waf_detector.detect_waf(headers, None)
    res["cookies"] = session_analyzer.analyze_cookies(target, timeout=timeout)
    return {"target": target, "summary": summary.build_summary(res), "raw": res}
