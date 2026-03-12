#!/usr/bin/env python3
"""
osint_main.py
Single-file OSINT tool (passive) that:
 - collects domain WHOIS, DNS, SSL certificate, basic web crawl, metadata extraction
 - attempts passive subdomain enumeration via crt.sh
 - checks public PDFs/images for metadata
 - optional Shodan / HIBP integrations if API keys provided
 - produces JSON raw output and a PDF report.

Usage:
  python3 osint_main.py --targets zorg-saam.be zorgsaam.tobacube.be 109.135.69.8/29 --full

Notes:
 - This tool is passive only; it will not perform active vulnerability exploits or brute force.
 - Respect scope and laws. Do not enable additional active modules unless authorized.
"""
import os
import sys
import json
import argparse
import socket
import ssl
import datetime
import time
import re
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
import whois
import dns.resolver
import tldextract
from fpdf import FPDF
from PyPDF2 import PdfReader
from PIL import Image
from io import BytesIO
from ipwhois import IPWhois
from dateutil import parser as dateparser
from colorama import Fore, Style

# ---------------------------
# Configuration
# ---------------------------
OUTPUT_DIR = "output"
USER_AGENT = "Howest-OSINT-Tool/1.0 (+https://howest.be)"
CRTSH_URL = "https://crt.sh/?q=%25.{domain}&output=json"
DEFAULT_TIMEOUT = 10

# Load config if it exists
CONFIG_FILE = "config.json"
if os.path.exists(CONFIG_FILE):
    with open(CONFIG_FILE, "r") as fh:
        CONFIG = json.load(fh)
else:
    CONFIG = {"shodan_api_key": "", "haveibeenpwned_api_key": ""}

# ---------------------------
# Utility helpers
# ---------------------------
def safe_request(url, headers=None, stream=False, timeout=DEFAULT_TIMEOUT):
    headers = headers or {}
    headers.setdefault("User-Agent", USER_AGENT)
    try:
        r = requests.get(url, headers=headers, timeout=timeout, stream=stream, allow_redirects=True)
        return r
    except Exception as e:
        return None

def ensure_out_dir():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR, exist_ok=True)

def is_ip(item):
    try:
        socket.inet_aton(item)
        return True
    except Exception:
        return False

# ---------------------------
# WHOIS
# ---------------------------
def do_whois(domain):
    print(Fore.CYAN + f"[WHOIS] {domain}" + Style.RESET_ALL)
    try:
        w = whois.whois(domain)
        # normalize to dict
        return dict(w)
    except Exception as e:
        return {"error": str(e)}

# ---------------------------
# DNS records
# ---------------------------
def dns_records(domain):
    print(Fore.CYAN + f"[DNS] {domain}" + Style.RESET_ALL)
    out = {}
    resolver = dns.resolver.Resolver()
    resolver.lifetime = DEFAULT_TIMEOUT
    try:
        for rtype in ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"]:
            try:
                answers = resolver.resolve(domain, rtype, raise_on_no_answer=False)
                out[rtype] = [r.to_text() for r in answers]
            except Exception:
                out[rtype] = []
    except Exception as e:
        out["error"] = str(e)
    return out

# ---------------------------
# SSL / TLS certificate info (connect to site)
# ---------------------------
def get_ssl_cert(hostname, port=443):
    print(Fore.CYAN + f"[SSL] {hostname}:{port}" + Style.RESET_ALL)
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((hostname, port), timeout=DEFAULT_TIMEOUT) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                return cert
    except Exception as e:
        return {"error": str(e)}

# ---------------------------
# Basic web fetch and fingerprint
# ---------------------------
COMMON_SIGS = {
    "WordPress": ["/wp-login.php", "wp-content", "wp-includes"],
    "Joomla": ["Joomla!"],
    "Drupal": ["Drupal"],
    "Apache": ["Server: Apache", "Apache/"],
    "nginx": ["Server: nginx", "nginx/"],
    "IIS": ["Server: Microsoft-IIS"]
}

def fetch_site(url):
    print(Fore.CYAN + f"[HTTP] {url}" + Style.RESET_ALL)
    headers = {"User-Agent": USER_AGENT}
    try:
        r = requests.get(url, headers=headers, timeout=DEFAULT_TIMEOUT, allow_redirects=True)
    except Exception as e:
        return {"error": str(e)}
    info = {"status_code": r.status_code, "final_url": r.url, "headers": dict(r.headers)}
    body = r.text[:200000] if r.text else ""
    info["title"] = None
    try:
        soup = BeautifulSoup(r.text, "html.parser")
        if soup.title and soup.title.string:
            info["title"] = soup.title.string.strip()
    except Exception:
        pass
    # fingerprint heuristics
    info["tech"] = []
    body_low = (r.text or "").lower()
    for tech, markers in COMMON_SIGS.items():
        for m in markers:
            if m.lower() in body_low or (r.headers and any(m.lower() in v.lower() for v in r.headers.values() if isinstance(v, str))):
                info["tech"].append(tech)
                break
    # meta generator
    try:
        gen = soup.find("meta", {"name": "generator"})
        if gen and gen.get("content"):
            info["generator"] = gen.get("content")
    except Exception:
        info["generator"] = None
    return info

# ---------------------------
# Subdomains via crt.sh (passive)
# ---------------------------
def crtsh_subdomains(domain, limit=200):
    print(Fore.CYAN + f"[crt.sh] query {domain}" + Style.RESET_ALL)
    url = CRTSH_URL.format(domain=domain)
    try:
        r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=DEFAULT_TIMEOUT)
        if r is None or r.status_code != 200:
            return []
        data = r.json()
        subs = set()
        for item in data:
            name = item.get("name_value")
            if name:
                for part in name.split("\n"):
                    subs.add(part.strip())
        return sorted(list(subs))
    except Exception as e:
        # fallback: scrape HTML
        return []

# ---------------------------
# IP info (whois / ipwhois)
# ---------------------------
def ip_info(ip):
    print(Fore.CYAN + f"[IPWhois] {ip}" + Style.RESET_ALL)
    try:
        obj = IPWhois(ip)
        res = obj.lookup_rdap(depth=1)
        return res
    except Exception as e:
        return {"error": str(e)}

# ---------------------------
# Crawl site for PDFs/images and extract metadata
# ---------------------------
def find_assets_and_extract(domain_url, max_pages=20):
    print(Fore.CYAN + f"[CRAWL] {domain_url}" + Style.RESET_ALL)
    headers = {"User-Agent": USER_AGENT}
    to_visit = [domain_url]
    seen = set()
    assets = {"pdfs": [], "images": []}
    pages = 0
    while to_visit and pages < max_pages:
        url = to_visit.pop(0)
        if url in seen:
            continue
        seen.add(url)
        try:
            r = requests.get(url, headers=headers, timeout=DEFAULT_TIMEOUT)
            if r is None or r.status_code >= 400:
                continue
            pages += 1
            soup = BeautifulSoup(r.text, "html.parser")
            # find links
            for a in soup.find_all("a", href=True):
                href = a["href"]
                parsed = urlparse(href)
                if parsed.scheme in ("http", "https"):
                    link = href
                else:
                    link = urljoin(url, href)
                # same-host check
                if tldextract.extract(domain_url).registered_domain in link:
                    if link not in seen:
                        to_visit.append(link)
                # collect pdfs
                if link.lower().endswith(".pdf"):
                    assets["pdfs"].append(link)
            # find images
            for img in soup.find_all("img", src=True):
                src = img["src"]
                if urlparse(src).scheme in ("http", "https"):
                    link = src
                else:
                    link = urljoin(url, src)
                assets["images"].append(link)
        except Exception:
            continue
    # deduplicate
    assets["pdfs"] = sorted(list(set(assets["pdfs"])))
    assets["images"] = sorted(list(set(assets["images"])))
    # extract metadata
    def extract_pdf_meta(pdf_url):
        try:
            r = requests.get(pdf_url, timeout=DEFAULT_TIMEOUT, headers=headers)
            reader = PdfReader(BytesIO(r.content))
            md = reader.metadata
            return {"url": pdf_url, "metadata": dict(md)}
        except Exception as e:
            return {"url": pdf_url, "error": str(e)}

    def extract_image_exif(img_url):
        try:
            r = requests.get(img_url, timeout=DEFAULT_TIMEOUT, headers=headers)
            img = Image.open(BytesIO(r.content))
            exif = {}
            try:
                info = img._getexif()
                if info:
                    for tag, val in info.items():
                        exif[tag] = str(val)
            except Exception:
                exif = {}
            return {"url": img_url, "exif": exif}
        except Exception as e:
            return {"url": img_url, "error": str(e)}

    pdf_metas = [extract_pdf_meta(u) for u in assets["pdfs"]]
    img_metas = [extract_image_exif(u) for u in assets["images"]]
    return {"assets": assets, "pdf_metas": pdf_metas, "img_metas": img_metas}

# ---------------------------
# Breach checks (HaveIBeenPwned) - optional
# ---------------------------
def hibp_check(email):
    # requires API key in CONFIG
    key = CONFIG.get("haveibeenpwned_api_key", "")
    if not key:
        return {"skipped": "no_api_key"}
    url = f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}"
    headers = {"hibp-api-key": key, "User-Agent": USER_AGENT}
    try:
        r = requests.get(url, headers=headers, timeout=DEFAULT_TIMEOUT)
        if r.status_code == 200:
            return {"breaches": r.json()}
        elif r.status_code == 404:
            return {"breaches": []}
        else:
            return {"error": r.status_code}
    except Exception as e:
        return {"error": str(e)}

# ---------------------------
# Shodan lookup - optional
# ---------------------------
def shodan_lookup(ip_or_net):
    key = CONFIG.get("shodan_api_key", "")
    if not key:
        return {"skipped": "no_api_key"}
    try:
        import shodan
        api = shodan.Shodan(key)
        results = {}
        if "/" in ip_or_net:
            # search net
            try:
                hosts = api.search("net:" + ip_or_net)
                results["matches"] = hosts
            except Exception as e:
                results["error"] = str(e)
        else:
            try:
                host = api.host(ip_or_net)
                results["host"] = host
            except Exception as e:
                results["error"] = str(e)
        return results
    except Exception as e:
        return {"error": str(e)}

# ---------------------------
# Risk scoring helper (simple)
# ---------------------------
def simple_risk_score(findings):
    # Very naive: count high-risk signs
    score = 0
    reasons = []
    if findings.get("whois", {}).get("error"):
        reasons.append("whois_fail")
    if findings.get("dns", {}).get("MX"):
        score += 0  # no penalty
    # SSL expire soon?
    cert = findings.get("ssl")
    if isinstance(cert, dict) and cert.get("notAfter"):
        try:
            dt = dateparser.parse(cert.get("notAfter"))
            days = (dt - datetime.datetime.utcnow()).days
            if days < 30:
                score += 5
                reasons.append("ssl_expires_soon")
        except Exception:
            pass
    # tech - known CMS old versions (simple heuristic)
    techs = findings.get("http", {}).get("tech", [])
    if "WordPress" in techs:
        score += 2
        reasons.append("wordpress_detected")
    return {"score": score, "reasons": reasons}

# ---------------------------
# PDF report generation (FPDF)
# ---------------------------
class SimpleReport:
    def __init__(self, data, generated_by="Howest OSINT Tool"):
        self.data = data
        self.meta = {"generated_at": datetime.datetime.utcnow().isoformat() + "Z", "by": generated_by}
        ensure_out_dir()

    def _add_header(self, pdf, title):
        pdf.set_font("Arial", "B", 16)
        pdf.cell(0, 10, title, ln=True)
        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 7, f"Generated: {self.meta['generated_at']}", ln=True)
        pdf.ln(4)

    def _add_section_title(self, pdf, title):
        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 8, title, ln=True)
        pdf.ln(2)

    def generate(self, filename=None):
        if filename is None:
            filename = os.path.join(OUTPUT_DIR, "report.pdf")
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.add_page()
        self._add_header(pdf, "OSINT Report - WZC Sint Jozef (Zorg-Saam)")
        # Executive summary
        self._add_section_title(pdf, "Executive Summary")
        pdf.set_font("Arial", "", 11)
        exec_text = self.data.get("executive_summary", "No executive summary available.")
        pdf.multi_cell(0, 6, exec_text)
        pdf.ln(2)
        # Findings
        self._add_section_title(pdf, "Key Findings")
        for target, findings in self.data.get("findings", {}).items():
            pdf.set_font("Arial", "B", 11)
            pdf.cell(0, 6, f"- {target}", ln=True)
            pdf.set_font("Arial", "", 10)
            # short summary lines (whois, ip, cert expiry)
            who = findings.get("whois")
            if isinstance(who, dict):
                owner = who.get("org") or who.get("name") or who.get("registrar")
                if owner:
                    pdf.multi_cell(0, 6, f"  Owner/Registrar: {owner}")
            dns = findings.get("dns", {})
            ips = dns.get("A", [])
            if ips:
                pdf.multi_cell(0, 6, f"  A records: {', '.join(ips)}")
            http = findings.get("http", {})
            if http.get("status_code"):
                pdf.multi_cell(0, 6, f"  HTTP: {http.get('status_code')} - title: {http.get('title') or 'n/a'}")
            risk = findings.get("risk", {})
            pdf.multi_cell(0, 6, f"  Risk score: {risk.get('score')} Reasons: {', '.join(risk.get('reasons',[]))}")
            pdf.ln(1)
        # Recommendations
        self._add_section_title(pdf, "Recommendations (high level)")
        pdf.set_font("Arial", "", 11)
        recs = self.data.get("recommendations", [])
        if not recs:
            pdf.multi_cell(0, 6, "No automated recommendations generated.")
        else:
            for r in recs:
                pdf.multi_cell(0, 6, f" - {r}")
        pdf.ln(4)
        # Appendix: show JSON path
        self._add_section_title(pdf, "Appendix")
        pdf.set_font("Arial", "", 9)
        pdf.multi_cell(0, 6, f"Raw data saved to: {os.path.join(OUTPUT_DIR,'raw_data.json')}")
        # save
        pdf.output(filename)
        return filename

# ---------------------------
# Main orchestration
# ---------------------------
def analyze_target(target):
    result = {}
    # handle domain vs IP vs URL
    if re.match(r"^\d+\.\d+\.\d+\.\d+(/\d+)?$", target):
        # IP or range
        result["type"] = "ip"
        if "/" in target:
            result["ip_range"] = target
            # optional: treat as shodan-only
            result["shodan"] = shodan_lookup(target) if CONFIG.get("shodan_api_key") else {"skipped": "no_api_key"}
        else:
            result["ip"] = target
            result["ipwhois"] = ip_info(target)
            result["shodan"] = shodan_lookup(target) if CONFIG.get("shodan_api_key") else {"skipped": "no_api_key"}
    else:
        # assume domain
        result["type"] = "domain"
        if not target.startswith("http"):
            base = "https://" + target
        else:
            base = target
        result["whois"] = do_whois(target)
        result["dns"] = dns_records(target)
        # SSL: try connecting to host directly
        stripped = target
        if ":" in stripped:
            host = stripped.split(":")[0]
        else:
            host = stripped
        result["ssl"] = get_ssl_cert(host)
        # HTTP fetch
        result["http"] = fetch_site(base)
        # crt.sh subs
        try:
            result["subdomains"] = crtsh_subdomains(target)
        except Exception:
            result["subdomains"] = []
        # crawled assets (pdfs/images etc)
        result["assets"] = find_assets_and_extract(base)
        # optional HIBP for discovered emails (dummy here)
        result["risk"] = simple_risk_score({"ssl": result.get("ssl"), "http": result.get("http")})
        # optional Shodan for A records
        a_ips = result["dns"].get("A", [])
        if a_ips and CONFIG.get("shodan_api_key"):
            result["shodan"] = {}
            for ip in a_ips:
                result["shodan"][ip] = shodan_lookup(ip)
        else:
            result["shodan"] = {"skipped": "no_api_key_or_no_ips"}
    return result

def build_executive_summary(findings):
    lines = []
    lines.append("Automated OSINT performed on targets provided in scope.")
    tcount = len(findings)
    lines.append(f"{tcount} target(s) scanned (passive only).")
    # high-level issues
    high = []
    for t, f in findings.items():
        if f.get("risk", {}).get("score", 0) >= 5:
            high.append(t)
    if high:
        lines.append("High risk items discovered for: " + ", ".join(high))
    else:
        lines.append("No high-risk automated indicators discovered (manual review recommended).")
    lines.append("This report contains raw evidence and suggested mitigations. Note: active testing was not performed.")
    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(description="Passive OSINT tool - single-run")
    parser.add_argument("--targets", nargs="+", required=True, help="List of targets (domains or IP ranges)")
    parser.add_argument("--full", action="store_true", help="Run full passive collection")
    args = parser.parse_args()
    ensure_out_dir()
    findings = {}
    for t in args.targets:
        t0 = t.strip()
        try:
            findings[t0] = analyze_target(t0)
        except Exception as e:
            findings[t0] = {"error": str(e)}
    # Save raw JSON
    raw_path = os.path.join(OUTPUT_DIR, "raw_data.json")
    with open(raw_path, "w") as fh:
        json.dump({"meta": {"generated_at": datetime.datetime.utcnow().isoformat()+"Z"}, "findings": findings}, fh, indent=2, default=str)
    # Build executive summary
    exec_sum = build_executive_summary(findings)
    # Simple recommendations (automated heuristics)
    recs = [
        "Review SSL/TLS certificate expirations and renew before expiry.",
        "Harden public-facing web servers (remove unnecessary headers, update CMS and dependencies).",
        "Audit exposed IPs/services and ensure only required ports are reachable.",
        "Review any found PDF/image metadata and sanitize publishing process.",
        "Perform an authorized internal vulnerability scan and a web app pentest for critical URLs in scope."
    ]
    dataset = {"executive_summary": exec_sum, "findings": findings, "recommendations": recs}
    reporter = SimpleReport(dataset)
    pdf_path = reporter.generate(os.path.join(OUTPUT_DIR, "report.pdf"))
    print(Fore.GREEN + f"Report generated: {pdf_path}" + Style.RESET_ALL)
    print(Fore.GREEN + f"Raw data saved: {raw_path}" + Style.RESET_ALL)

if __name__ == "__main__":
    main()
