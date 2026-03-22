# 🛡️ Security & Network Toolkit — Reworked Apps

A collection of desktop and web-based security, OSINT, and network analysis tools built with **Python + FastAPI** backends and lightweight HTML/JS or pywebview frontends. Each project is self-contained and designed for use in lab or authorized penetration testing environments.

---

## 📁 Projects Overview

| Project | Type | Description |
|---|---|---|
| `explorer_rework` | Desktop App | Cross-platform drill-down file system explorer |
| `forensic_file_analyzer` | Desktop App | Static file analysis and IOC detection |
| `kali_pentest` | Web Dashboard | GUI wrapper for common Kali Linux pentest tools |
| `network_monitor_rework` | Desktop App | Live packet-level network traffic monitor |
| `osint_rework` | Desktop App | Full OSINT recon + active web pentest suite |
| `providers_lookup` | CLI Script | BGP upstream provider lookup for a domain |

---

## 🗂️ Project Details

### 1. `explorer_rework` — Drill-Down File System Explorer

A cross-platform desktop file explorer with a visual drill-down interface built on a FastAPI backend served through a pywebview window.

**Features:**
- Lists all drives/volumes (Windows, Linux, macOS)
- Drill-down directory traversal with child node limiting
- Displays file type, size, and extension metadata
- Runs as a native desktop window (no browser required)

**Stack:** Python · FastAPI · pywebview · Uvicorn

**Run:**
```bash
pip install fastapi uvicorn pywebview
python app.py
```

---

### 2. `forensic_file_analyzer` — Static File Forensics Tool

A desktop application for performing quick forensic analysis on uploaded files. Designed for malware triage and IOC identification without executing the file.

**Features:**
- MD5 / SHA1 / SHA256 hash computation
- File metadata extraction (size, type, timestamps)
- Shannon entropy calculation (detects packed/encrypted sections)
- Hex dump viewer
- ASCII and UTF-16LE string extraction
- PE header parsing (Windows executables)
- IOC rule matching across strings, entropy thresholds, and PE imports

**Stack:** Python · FastAPI · pywebview · pefile · python-magic

**Requirements:**
```
fastapi
uvicorn
pywebview
pefile
python-magic
python-multipart
```

**Run:**
```bash
pip install -r requirements.txt
python app.py
```

---

### 3. `kali_pentest` — Kali Linux Pentest Dashboard

A local web dashboard that wraps commonly used Kali Linux tools behind a REST API, with a background job queue so long-running scans don't block the browser.

**Included Tools:**
- **Nmap** — port scanning and service detection
- **Nikto** — web server vulnerability scanner
- **Gobuster** — directory and DNS brute-forcing
- **SQLMap** — SQL injection detection and exploitation

**Features:**
- Web GUI (no desktop dependency, runs in any browser)
- Asynchronous background job queue with status tracking
- Scan results saved as JSON files in `backend/results/`
- Input validation for hosts, URLs, ports, and wordlists
- Safe subprocess execution with `shell=False`

**Stack:** Python · FastAPI · Pydantic · Uvicorn

**Requirements:**
```
fastapi==0.116.1
uvicorn[standard]==0.35.0
pydantic==2.11.7
python-multipart==0.0.20
```

**Run:**
```bash
cd kali_pentest
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Then open: `http://127.0.0.1:8000`

> ⚠️ **Only use on systems you are authorized to test.**

---

### 4. `network_monitor_rework` — NetGlass Live Traffic Monitor

A real-time network monitor that sniffs packets at the interface level using Scapy and attributes traffic to running processes via psutil. Streams live data to the frontend via WebSocket.

**Features:**
- Live packet sniffing (IPv4 + IPv6, TCP + UDP)
- Per-process bandwidth attribution (upload / download)
- Rolling 24-hour time-series storage
- WebSocket (`/ws/ticks`) for real-time frontend updates
- REST endpoints for historical series and per-app summaries
- Runs as a native desktop window via pywebview

**Stack:** Python · FastAPI · Scapy · psutil · WebSockets · pywebview

**Run:**
```bash
pip install fastapi uvicorn pywebview scapy psutil
python app.py
```

> ⚠️ **Packet sniffing typically requires elevated privileges (root / Administrator).**

---

### 5. `osint_rework` — OSINT Recon & Web Pentest Suite

A comprehensive OSINT and active reconnaissance tool combining passive intelligence gathering with active web application security probing. Runs as a pywebview desktop app and supports JSON export of results.

**OSINT / Passive Recon:**
- IP info, reverse DNS, and WHOIS (domain + IP)
- DNS records (A, AAAA, MX, NS, TXT, CNAME, CAA, PTR) with zone transfer attempt
- SPF / DMARC / DNS health checks
- Subdomain discovery
- Port scanning (common + custom ranges)
- HTTP header analysis

**Active Pentest Modules (`/backend/pentest/`):**

| Module | Description |
|---|---|
| `param_fuzz` | Parameter fuzzing |
| `js_scanner` | JavaScript file analysis for secrets/endpoints |
| `dir_bruteforce` | Directory brute-forcing |
| `waf_detector` | Web Application Firewall detection |
| `cors_checker` | CORS misconfiguration check |
| `open_redirect` | Open redirect probe |
| `xss_probe` | Reflected XSS detection |
| `sqli_probe` | SQL injection probe |
| `ssrf_checker` | SSRF vulnerability check |
| `auth_fingerprinter` | Authentication mechanism fingerprinting |
| `api_scanner` | API endpoint discovery |
| `robots_analyzer` | robots.txt analysis |
| `favicon_hash` | Favicon hash (Shodan-style fingerprinting) |
| `tls_checker` | TLS/SSL certificate and cipher analysis |
| `error_analyzer` | Error page information leakage detection |
| `session_analyzer` | Session cookie security analysis |
| `file_upload_tester` | File upload vulnerability testing |
| `csp_analyzer` | Content Security Policy analysis |
| `summary` | Aggregated findings summary |

**Stack:** Python · FastAPI · dnspython · ipwhois · python-whois · BeautifulSoup4 · pywebview · mmh3

**Requirements:**
```
fastapi
uvicorn[standard]
requests
dnspython
beautifulsoup4
ipwhois
python-whois
pywebview
mmh3
```

**Run:**
```bash
pip install -r requirements.txt
python app.py
```

> ⚠️ **Only use on domains and systems you own or have explicit authorization to test.**

---

### 6. `providers_lookup` — BGP Upstream Provider Lookup

A lightweight CLI utility that resolves the upstream BGP providers for a given domain by querying RIPE Stat and scraping `bgp.he.net`.

**Features:**
- Resolves domain to IPv4
- Queries RIPE Stat API for origin ASN
- Scrapes `bgp.he.net` for upstream provider names
- Outputs alphabetical list + top 5 providers

**Stack:** Python · requests · BeautifulSoup4

**Usage:**
```bash
pip install requests beautifulsoup4 lxml
python providers.py example.com
```

**Output example:**
```
Domain: example.com
Resolved IPv4: 93.184.216.34
Origin ASN: AS15133

Upstream providers (alphabetical):
- Hurricane Electric
- Telia Carrier
...

Top 5 (alphabetical):
Hurricane Electric
...
```

---

## 🏗️ Common Architecture

All multi-file projects follow the same structure:

```
<project>/
├── app.py              # pywebview launcher (desktop apps)
├── backend/
│   ├── main.py         # FastAPI app + route definitions
│   ├── providers/      # Data-fetching/analysis modules
│   ├── pentest/        # Active probe modules (osint_rework only)
│   ├── tools/          # External tool wrappers (kali_pentest only)
│   ├── services/       # Business logic (kali_pentest only)
│   └── models/         # Pydantic schemas
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
└── requirements.txt
```

Desktop apps (explorer, forensic analyzer, network monitor, OSINT) all use the same pattern: spin up a local FastAPI/Uvicorn server on a random free port, then open a pywebview window pointed at `http://127.0.0.1:<port>/`.

---

## ⚠️ Legal & Ethical Notice

These tools are intended for **authorized security research, CTF environments, and lab use only**. Running active scans, exploit probes, or packet sniffers against systems you do not own or have explicit written permission to test may be **illegal** in your jurisdiction. Always obtain proper authorization before use.

---

## 📄 License

See individual project folders for license information.