# ️ Security & Network Toolkit — Reworked Apps

A collection of desktop and web-based security, OSINT, and network analysis tools built with **Python + FastAPI** backends and lightweight HTML/JS or pywebview frontends. Each project is self-contained and designed for use in lab or authorized penetration testing environments.

---

##  Projects

| Project | Type | Description |
|---|---|---|
| [`explorer_rework`](#1-explorer_rework--drill-down-file-system-explorer) | Desktop App | Cross-platform visual file system explorer |
| [`forensic_file_analyzer`](#2-forensic_file_analyzer--static-file-forensics-tool) | Desktop App | Static malware triage and IOC detection |
| [`kali_pentest`](#3-kali_pentest--kali-linux-pentest-dashboard) | Web Dashboard | GUI wrapper for common Kali Linux pentest tools |
| [`network_monitor_rework`](#4-network_monitor_rework--netglass-live-traffic-monitor) | Desktop App | Live per-process network traffic monitor |
| [`osint_rework`](#5-osint_rework--osint-recon--web-pentest-suite) | Desktop App | Full OSINT recon + active web pentest suite |
| [`providers_lookup`](#6-providers_lookup--bgp-upstream-provider-lookup) | CLI Script | BGP upstream provider lookup for a domain |
| [`f1_telemetry`](#7-f1_telemetry--f1-25-live-telemetry-dashboard) | Web Dashboard | Real-time F1 25 racing telemetry dashboard with lap history |

---

## 1. `explorer_rework` — Drill-Down File System Explorer

A cross-platform desktop file explorer that renders your file system as an **interactive force-directed graph** using D3.js. Every folder you open becomes a node cluster; files and subfolders branch out from it. You can pan, zoom, pin nodes, and filter by name in real time.

### How it works

The Python launcher (`app.py`) finds a free port, starts a Uvicorn/FastAPI server in a background thread, then opens a pywebview window pointing at `http://127.0.0.1:<port>/`. The entire UI runs inside that native window — no browser needed.

The FastAPI backend (`backend/main.py`) exposes four REST endpoints:

| Endpoint | What it does |
|---|---|
| `GET /drives` | Lists all drives/volumes. On Windows: scans A–Z for existing drive letters. On Linux/macOS: returns `/` plus anything mounted under `/mnt`, `/media`, `/Volumes`, `/run/media`. |
| `GET /dir?base=<path>` | Lists immediate children of a directory (up to 500 entries). Returns a graph payload: a `nodes` array (each with id, name, type, size, extension) and a `links` array (parent → child edges). Handles `PermissionError` gracefully. |
| `GET /disk_usage?path=<path>` | Returns total/used/free bytes (and human-readable versions) for the volume containing the given path, using `shutil.disk_usage`. |
| `GET /read?path=<path>` | Reads up to the first 20 000 characters of a text file for the preview panel. Returns `[Binary or unreadable file]` for non-text content. |

The frontend renders the graph using **D3.js force simulation** with:
- `forceLink` to pull connected nodes together
- `forceManyBody` (repulsion) to spread nodes apart
- `forceCollide` to prevent overlap
- `forceCenter` to keep everything anchored
- A radial hint force that positions children around the root node

A **2 000-particle ambient background** animates continuously in a `<g>` layer beneath the graph, wrapping around a 3 000×3 000 virtual field.

Nodes have three visual states: normal, **hover** (temporarily pinned in place), and **user-pinned** (double-click to lock). Clicking a folder drills into it; clicking a file loads a text preview in the right panel. A live search input filters nodes and dims non-matching ones instantly.

### Stack

Python · FastAPI · pywebview · Uvicorn · D3.js v7

### Run

```bash
pip install fastapi uvicorn pywebview
python app.py
```

---

## 2. `forensic_file_analyzer` — Static File Forensics Tool

A desktop application for quick static analysis of suspicious files. Upload any file through the UI and get a full breakdown: hashes, metadata, entropy profile, hex dump, extracted strings, PE header details, and an automated IOC severity verdict — all without executing the file.

### How it works

Same launcher pattern as the explorer: `app.py` spawns a FastAPI/Uvicorn server on a random port and opens a pywebview window. The backend is organized around a central `analyze` endpoint that runs all analysis modules in sequence.

#### API endpoints

| Endpoint | What it does |
|---|---|
| `POST /api/upload` | Accepts a file upload, saves it to a temp directory (`/tmp/ffa_uploads/`), returns the path and file size. |
| `GET /api/analyze?path=<path>` | Runs all analysis modules on the uploaded file and returns a single JSON report. |
| `GET /api/hex?path=<path>&offset=<n>&length=<n>` | Returns a hex dump chunk for the hex viewer. |
| `GET /api/strings?path=<path>` | Returns extracted ASCII and UTF-16LE strings. |

#### Analysis modules (`backend/providers/`)

**`metadata_tools.py`** — reads basic file metadata: name, size, extension, MIME type (via `python-magic`), and an executable hint flag based on extension (`.exe`, `.dll`, `.bat`, `.ps1`, etc.).

**`entropy_tools.py`** — computes **Shannon entropy** across the whole file in 16 KB windows. Returns an `overall` entropy score and a `windows` array for charting. High entropy (≥ 7.2 out of 8.0) is a strong indicator of packing, encryption, or obfuscation. The formula used is the standard information-theoretic entropy: `H = -Σ p(x) · log₂(p(x))` over all 256 possible byte values.

**`hex_tools.py`** — reads raw bytes from an arbitrary offset and returns a formatted hex + ASCII dump for the viewer panel.

**`strings_tools.py`** — extracts printable ASCII strings (minimum length 4) and UTF-16LE strings from the raw binary. Returns up to 200 ASCII and 100 Unicode results. Useful for spotting embedded URLs, commands, registry keys, or other indicators.

**`pe_tools.py`** — if the file starts with the `MZ` magic bytes, parses it as a Windows PE (Portable Executable) using the `pefile` library. Extracts:
- Machine type and compile timestamp
- Entry point and image base addresses
- Subsystem type
- All PE sections with virtual address, raw/virtual size, per-section Shannon entropy, characteristics flags, and a `wx` (writable + executable) flag
- Full import table: DLL names and function names (up to 50 per DLL, 40 DLLs total)
- Export table (up to 200 names)

**`ioc_rules.py`** — runs automated IOC (Indicator of Compromise) analysis across all previous results and assigns a severity verdict (`ok`, `medium`, or `high`). Checks:

| Rule | Severity | Trigger |
|---|---|---|
| `high_entropy` | 🔴 High | Overall entropy ≥ 7.2 |
| `exe_extension` | 🟡 Medium | File has executable extension |
| `sus_strings` | 🟡 Medium | Strings contain any of: `powershell`, `cmd.exe`, `wscript`, `certutil`, `mimikatz`, `base64`, `Invoke-WebRequest`, `http://`, `pastebin`, `discordapp`, and more |
| `wx_section` | 🔴 High | Any PE section is both writable and executable, or has section-level entropy ≥ 7.2 |
| `sus_imports` | 🟡 Medium | PE imports suspicious WinAPI functions: `VirtualAlloc`, `CreateRemoteThread`, `WriteProcessMemory`, `URLDownloadToFile`, `CryptDecrypt`, `WSASocket`, `RegSetValue`, and more |

### Stack

Python · FastAPI · pywebview · Uvicorn · pefile · python-magic · python-multipart

### Requirements

```
fastapi
uvicorn
pywebview
pefile
python-magic
python-multipart
```

### Run

```bash
pip install -r requirements.txt
python app.py
```

---

## 3. `kali_pentest` — Kali Linux Pentest Dashboard

A browser-based dashboard that exposes a clean web UI for running **Nmap**, **Nikto**, **Gobuster**, and **SQLMap** — tools that already need to be installed on your Kali Linux system. A background job queue ensures long-running scans don't block HTTP requests, and results are persisted as JSON files on disk.

### How it works

This project uses a plain Uvicorn server (no pywebview), so it opens in any browser. The FastAPI app serves the static frontend from `frontend/` and exposes a REST API under `/api/`.

#### Architecture

```
Browser  ──►  FastAPI (main.py)
                 │
                 ├─ JobManager (services/jobs.py)       ← in-memory job store
                 │       │
                 │       └─ ThreadPoolExecutor          ← runs tool subprocess
                 │
                 ├─ Validation (services/validation.py) ← input sanitization
                 │
                 └─ Tool wrappers (tools/)
                         ├─ nmap_tools.py
                         ├─ nikto_tool.py
                         ├─ gobuster.py
                         └─ sqlmap_tool.py
```

#### Job system (`services/jobs.py`)

Every scan request creates a `Job` object with a UUID, tool name, status (`pending` → `running` → `done`/`error`), start/end timestamps, parameters, and output. Jobs are submitted to a `ThreadPoolExecutor` which runs the tool wrapper in a background thread. Results are written to `backend/results/<job_id>.json`.

The `JobManager` keeps all jobs in an in-memory dict and exposes `create_job`, `get_job`, and `list_jobs` methods.

#### Input validation (`services/validation.py`)

Validates all user-supplied input before passing it to subprocess calls:
- **Hosts**: must be valid IPs or hostnames (rejects shell metacharacters)
- **URLs**: must start with `http://` or `https://`
- **Ports**: must be numeric ranges like `80`, `80-443`, or `80,443,8080`
- **Wordlists**: must be absolute paths to existing files
- **Extra options**: strips common shell injection characters

#### Tool wrappers (`tools/`)

Each wrapper builds a `subprocess` command list (no `shell=True`) and runs it with `subprocess.run(capture_output=True, text=True)`. Output is returned as raw stdout/stderr text.

| Tool | Wrapper | Command built |
|---|---|---|
| Nmap | `nmap_tools.py` | `nmap <options> -p <ports> <target>` |
| Nikto | `nikto_tool.py` | `nikto -h <url> <options>` |
| Gobuster | `gobuster.py` | `gobuster dir -u <url> -w <wordlist> -x <extensions> <options>` |
| SQLMap | `sqlmap_tool.py` | `sqlmap -u <url> --batch <options>` |

#### API endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/scans/nmap` | POST | Submit an Nmap scan job |
| `/api/scans/nikto` | POST | Submit a Nikto scan job |
| `/api/scans/gobuster` | POST | Submit a Gobuster scan job |
| `/api/scans/sqlmap` | POST | Submit a SQLMap scan job |
| `/api/jobs` | GET | List all jobs (summary) |
| `/api/jobs/{job_id}` | GET | Get full details and output of a specific job |

#### Pydantic schemas (`models/schemas.py`)

Each tool has its own request schema (`NmapRequest`, `NiktoRequest`, `GobusterRequest`, `SqlmapRequest`) with typed and validated fields. Response schemas: `JobSummary` (id, tool, status, timestamps) and `JobDetail` (same + full output).

### Stack

Python · FastAPI · Pydantic v2 · Uvicorn · Nmap · Nikto · Gobuster · SQLMap

### Requirements

```
fastapi==0.116.1
uvicorn[standard]==0.35.0
pydantic==2.11.7
python-multipart==0.0.20
```

### Run

```bash
cd kali_pentest
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Open: `http://127.0.0.1:8000`

>  Requires Nmap, Nikto, Gobuster, and SQLMap to be installed on the system. Only use on systems you are authorized to test.

---

## 4. `network_monitor_rework` — NetGlass Live Traffic Monitor

A real-time network traffic monitor that sniffs packets at the OS level, attributes each packet to the process that owns the connection, aggregates bandwidth per second, and streams live updates to the frontend via **WebSocket**. Stores a rolling 24-hour history.

### How it works

On startup, two concurrent tasks begin:

1. **Sniffer thread** — runs `scapy.sniff()` in a daemon thread with a BPF filter (`ip and (tcp or udp) or (ip6 and (tcp or udp))`). Every packet that arrives triggers `_on_packet()`.

2. **Aggregator coroutine** — runs in the asyncio event loop, waking every 1 second to convert accumulated byte counters into bits-per-second, append a point to `GLOBAL_SERIES`, flush per-PID events to `APP_EVENTS`, reset counters, and broadcast the latest tick to all connected WebSocket clients.

#### Packet-to-process attribution

`_packet_pid(packet)` maps each packet to a PID using a connection index built by `_rebuild_conn_index()`. That function calls `psutil.net_connections()` to build a dict of `(local_ip, local_port, remote_ip, remote_port, proto) → pid`. The sniffer tries four fallback lookups (exact 5-tuple, reversed direction, local-port-only, remote-port-only) to handle edge cases.

The connection index is refreshed every 2 seconds by the aggregator. Local IP addresses are also refreshed every 2 seconds via `psutil.net_if_addrs()` to correctly detect whether a packet is inbound or outbound.

#### Data storage

```python
GLOBAL_SERIES: Deque[Point]    # (timestamp_ms, up_bps, down_bps) — max 86400 points (24h)
APP_EVENTS: Deque[Event]       # (timestamp_ms, pid, exe_name, up_bytes, down_bytes) — max 600 000 events
```

#### WebSocket hub

The `Hub` class maintains a list of `asyncio.Queue` objects, one per connected client. `_broadcast()` pushes the latest tick dict to every queue. The `/ws/ticks` endpoint accepts a connection, subscribes its queue to the hub, and streams JSON messages (`{ts, up_bps, down_bps}`) until the client disconnects.

#### REST endpoints

| Endpoint | Parameters | Returns |
|---|---|---|
| `WS /ws/ticks` | — | Real-time tick stream: `{ts, up_bps, down_bps}` every 1 second |
| `GET /series` | `window` (1–86400 seconds) | Array of `{ts, up_bps, down_bps}` points within the time window |
| `GET /summary` | `window`, `top` (1–50) | Upload/download totals + top-N processes ranked by traffic volume |

The `/summary` endpoint aggregates `APP_EVENTS` into per-PID totals and returns them sorted by total bytes, which the frontend renders as a per-app bandwidth table.

### Stack

Python · FastAPI · Scapy · psutil · WebSockets · pywebview · Uvicorn

### Run

```bash
pip install fastapi uvicorn pywebview scapy psutil
python app.py
```

>  Packet sniffing requires elevated privileges. Run as `root` on Linux/macOS or as Administrator on Windows.

---

## 5. `osint_rework` — OSINT Recon & Web Pentest Suite

The most comprehensive tool in the collection. Combines passive OSINT intelligence gathering with a full suite of active web application security probes. Results can be exported as JSON. Runs as a pywebview desktop app.

### How it works

Same launcher pattern: `app.py` starts a FastAPI server and opens a pywebview window. The backend is split into two subsystems: **providers** (passive recon) and **pentest modules** (active probing).

---

### Passive OSINT (`backend/providers/`)

#### `dns_tools.py` — DNS Analysis

Resolves any combination of record types (A, AAAA, MX, NS, TXT, CNAME, CAA, PTR) using `dnspython`. Supports:
- TTL values on all records
- DNS-over-HTTPS (DoH) as an alternative resolver
- Zone transfer attempt (AXFR) — tries to pull the full zone from each NS
- SPF record parsing — extracts and decodes the `v=spf1` TXT record
- DMARC parsing — fetches and parses `_dmarc.<domain>`
- CAA records — shows which CAs are authorized to issue certificates
- PTR records — reverse lookups for all resolved A/AAAA IPs
- DNS health checks — detects common misconfigurations

#### `whois_tools.py` — WHOIS Lookups

- `whois_domain(domain)` — queries domain registration data via `python-whois`
- `whois_ip(ip)` — queries IP ownership and ASN data via `ipwhois` (uses RDAP)

#### `subdomains.py` — Subdomain Discovery

Two-stage discovery process:

**Stage 1 — crt.sh query**: fetches the certificate transparency log for `%.domain` from `https://crt.sh/?q=...&output=json`, extracts all `name_value` / `common_name` entries that match the target domain, deduplicates them, and resolves each to IPv4/IPv6.

**Stage 2 — DNS brute-force**: tries a built-in wordlist of 40 common prefixes (`www`, `api`, `dev`, `staging`, `mail`, `vpn`, `admin`, `git`, `grafana`, `kibana`, `redis`, `backup`, etc.) by attempting `socket.gethostbyname()` for each.

Before brute-forcing, a **wildcard check** sends a random nonsense subdomain (e.g. `xkqzfmnjod.domain.com`) — if it resolves, all brute-force results are flagged as `wildcard_suspected`. Optional HTTP liveness checks probe each discovered subdomain over HTTP and HTTPS to confirm it is reachable.

#### `ports.py` — Port Scanner

Fully async port scanner using `asyncio` and a `Semaphore` for concurrency control (default: 200 concurrent probes).

- **TCP scan** — attempts `socket.connect()` with a configurable timeout (default 600ms). On success, optionally grabs a service banner (first 1 KB of response) and attempts ALPN negotiation for TLS ports (443, 8443) to detect HTTP/2 vs HTTP/1.1.
- **UDP scan** — sends protocol-appropriate probes for DNS (53), NTP (123), SNMP (161), IKE (500), and SSDP (1900).
- **Service hints** — maps well-known ports to service names (http, https, ssh, mysql, postgresql, rdp).
- **Common ports list** — 66 well-known ports covering databases, web servers, remote access, message brokers, monitoring tools, and more.
- **Custom port ranges** — parses expressions like `22,80,443,8000-9000`.

#### `http_headers.py` — HTTP Header Analysis

Fetches HTTP response headers and analyzes security posture: detects presence, absence, and quality of `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `X-XSS-Protection`. Also fingerprints the server via `Server` and `X-Powered-By` headers and checks for information leakage.

---

### Active Pentest Modules (`backend/pentest/`)

All active modules are lightweight HTTP-based probes using `requests`. They are designed for quick checks, not deep exploitation.

| Module | What it does |
|---|---|
| `xss_probe.py` | Injects a safe marker string (`XSSTEST_9f2d`) into a query parameter in three payload formats. Checks whether the payload is reflected verbatim in the response body. |
| `sqli_probe.py` | Sends four classic boolean/error-based SQL injection payloads to a target parameter. Checks for SQL error keywords in the response and compares response length against a baseline. |
| `tls_checker.py` | Opens a raw SSL socket and retrieves the negotiated protocol version (TLS 1.0–1.3), cipher suite, and full parsed certificate (subject, issuer, SANs, expiry). |
| `waf_detector.py` | Sends deliberately malformed requests and inspects response codes, headers, and body patterns to fingerprint common WAFs (Cloudflare, AWS WAF, Sucuri, ModSecurity, etc.). |
| `cors_checker.py` | Sends requests with crafted `Origin` headers and checks whether `Access-Control-Allow-Origin` / `Access-Control-Allow-Credentials` reflect unsafe values. |
| `dir_bruteforce.py` | Tries common paths and file names against the target URL and reports which return non-404 responses, with content type and response size. |
| `js_scanner.py` | Fetches all `<script src>` references, downloads each JS file, and scans for potential secrets (API keys, tokens, credentials) and internal endpoints. |
| `param_fuzz.py` | Injects fuzz strings into query parameters and POST body fields and looks for anomalous responses, errors, or length changes. |
| `open_redirect.py` | Injects redirect-target payloads into common redirect parameters (`redirect`, `url`, `next`, `return`, `to`, `goto`) and checks whether the server follows them to external domains. |
| `ssrf_checker.py` | Injects internal/loopback URLs into parameters and checks for unexpected successful responses indicating server-side request forgery. |
| `auth_fingerprinter.py` | Identifies authentication mechanisms: HTTP Basic/Digest/Bearer, form-based login, OAuth flows, JWT tokens in responses, and session cookie security attributes. |
| `api_scanner.py` | Probes common REST API paths (`/api/v1/`, `/swagger.json`, `/openapi.json`, `/graphql`, etc.) and checks which respond with non-404 status codes. |
| `robots_analyzer.py` | Fetches and parses `robots.txt`, extracts all `Disallow`/`Allow` paths, and highlights potentially interesting paths. |
| `favicon_hash.py` | Downloads `/favicon.ico` and computes its **MurmurHash3** (mmh3) — the same hash used by Shodan — for cross-referencing with Shodan's favicon index to identify the technology stack. |
| `session_analyzer.py` | Inspects `Set-Cookie` headers for missing security flags (`HttpOnly`, `Secure`, `SameSite`) and checks for weak cookie names that suggest default framework sessions. |
| `file_upload_tester.py` | Attempts to upload files with dangerous extensions (`.php`, `.asp`, `.jsp`, `.html`) to discovered upload endpoints and checks whether the server accepts them. |
| `csp_analyzer.py` | Parses the `Content-Security-Policy` header and flags weak directives: `unsafe-inline`, `unsafe-eval`, wildcard sources, missing `default-src`, and missing `upgrade-insecure-requests`. |
| `error_analyzer.py` | Sends requests designed to trigger error pages and checks whether responses leak stack traces, framework names, version numbers, or file system paths. |
| `summary.py` | Collects and consolidates results from all probe modules into a single severity-ranked findings list. |

### Export

The frontend saves full recon results as timestamped JSON to `frontend/exports/`, e.g. `example.com_20260301T174702Z.json`. The exports directory already contains several real scan results for reference.

### Stack

Python · FastAPI · dnspython · ipwhois · python-whois · BeautifulSoup4 · requests · mmh3 · pywebview · Uvicorn

### Requirements

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

### Run

```bash
pip install -r requirements.txt
python app.py
```

>  Only use on domains and systems you own or have explicit written authorization to test.

---

## 6. `providers_lookup` — BGP Upstream Provider Lookup

A standalone CLI script that traces the BGP upstream providers for any domain in three steps: DNS resolution → RIPE Stat ASN lookup → bgp.he.net scrape.

### How it works

**Step 1 — DNS resolution**: uses `socket.getaddrinfo()` with `AF_INET` to resolve the domain to an IPv4 address.

**Step 2 — Origin ASN via RIPE Stat**: sends a GET request to the [RIPE Stat prefix-overview API](https://stat.ripe.net/data/prefix-overview/data.json) with the resolved IP as the `resource` parameter. Parses `data.asns[0].asn` to get the origin Autonomous System Number.

**Step 3 — Upstream providers via bgp.he.net**: fetches `https://bgp.he.net/AS<asn>` and uses BeautifulSoup to locate the "Upstreams" section header, then reads the table that follows it. Extracts provider names from the second column of each row, deduplicates case-insensitively, and sorts alphabetically. Returns all found providers plus the top 5.

### Stack

Python · requests · BeautifulSoup4 · lxml

### Usage

```bash
pip install requests beautifulsoup4 lxml
python providers.py example.com
```

### Output example

```
Domain: howest.be
Resolved IPv4: 193.190.17.14
Origin ASN: AS2611

Upstream providers (alphabetical):
- Belnet
- NTT Communications
- RETN

Top 5 (alphabetical):
Belnet
NTT Communications
RETN
```

---

## 7. `f1_telemetry` — F1 25 Live Telemetry Dashboard

A real-time racing dashboard for **F1 25**, inspired by [f1-dash.com](https://f1-dash.com). Captures UDP telemetry packets broadcast by the game and serves a live dashboard over HTTP — accessible from any browser on the same network, including phones and tablets.

Unlike the other projects in this repo, this one lives under `other_projects/` rather than `apps_reworked/` and uses a pure `asyncio` stack instead of pywebview.

### How it works

`run.py` launches three concurrent services:

1. **UDP listener** (`server/udp_listener.py`) — binds to `0.0.0.0:20777` and receives raw binary packets from F1 25 at up to 20 Hz. Each packet is dispatched to the parser.

2. **Packet parser** (`server/packet_parser.py`) — decodes the binary F1 25 UDP spec (packet format 2025) into Python dicts using `struct.unpack_from`. Handles packet types: Motion (0), Session (1), LapData (2), CarTelemetry (6), CarStatus (7), and CarDamage (10).

3. **WebSocket + HTTP server** (`server/websocket_server.py`) — pushes live telemetry state as JSON to all connected browser clients over WebSocket, and serves the static dashboard files over HTTP.

A fourth component, `server/session_recorder.py`, watches the live state and persists every session and completed lap to a local SQLite database (`f1_telemetry.db`) via `server/database.py`.

#### Graceful shutdown

Signal handlers (`SIGINT`/`SIGTERM`) ensure that `ended_at` is always written to the current session row before the process exits — even on Windows where `add_signal_handler` falls back to `KeyboardInterrupt`.

#### Ports

| Port | Protocol | Purpose |
|---|---|---|
| `20777` | UDP | F1 25 → server (telemetry input) |
| `8765` | WebSocket | server → browser (live JSON push) |
| `8080` | HTTP | dashboard + history file server |

#### Database schema

Session and lap data are stored in `f1_telemetry.db` (SQLite, standard library only — no ORM).

**`sessions`** — one row per game session, with track name, session type, weather, total laps, track length, and ISO-8601 UTC timestamps for start and end.

**`laps`** — one row per completed lap, linked to a session. Stores lap time, sector times (S3 derived as `lap − S1 − S2`), tyre compound and age (captured at lap start so pit stops don't overwrite them), validity flag, fastest-lap flag, pit-stop flag, and fuel load.

### Project structure

```
other_projects/f1_telemetry/
├── run.py                      ← entry point
├── logger.py                   ← standalone raw-packet logger / debug tool
├── server/
│   ├── config.py               ← ports, struct formats, lookup tables
│   ├── state.py                ← shared live telemetry state
│   ├── packet_parser.py        ← binary UDP → Python dicts (F1 25 spec)
│   ├── udp_listener.py         ← async UDP socket loop
│   ├── session_recorder.py     ← persists sessions & laps to SQLite
│   ├── database.py             ← SQLite schema and query helpers
│   └── websocket_server.py     ← WebSocket push + HTTP file server
└── dashboard/
    ├── index.html              ← live telemetry view
    ├── history.html            ← lap history view
    ├── css/
    │   ├── style.css
    │   └── history.css
    └── js/
        ├── main.js
        ├── websocket.js        ← WS connection + auto-reconnect
        ├── ui.js               ← DOM update logic
        └── history.js          ← history page logic
```

### Stack

Python · asyncio · websockets · sqlite3 (stdlib only)

### Configure F1 25

**Options → Settings → Telemetry Settings**

| Setting | Value |
|---|---|
| UDP Telemetry | **On** |
| UDP IP Address | `127.0.0.1` (or your server PC's LAN IP if playing on a different machine) |
| UDP Port | `20777` |
| UDP Format | **2025** |
| UDP Send Rate | `20Hz` |

### Run

```bash
pip install websockets
python run.py
```

Open `http://localhost:8080` for the live dashboard or `http://localhost:8080/history.html` for lap history.

### Debugging

Use `logger.py` instead of `run.py` to capture and decode raw packets without running the full server. Output goes to `telemetry_log.json` (newline-delimited, flushed per packet) and `telemetry_log.txt` (human-readable summary).

```bash
python logger.py
```

---

## ️ Common Architecture

All `apps_reworked` desktop apps follow the same launcher pattern:

```
app.py  →  find_free_port()
        →  start Uvicorn server on random port (daemon thread)
        →  webview.create_window("Title", "http://127.0.0.1:<port>/")
        →  webview.start()   ← blocks until window is closed
        →  signal server to exit
```

All backends share the same project layout:

```
<project>/
├── app.py                  # pywebview launcher
├── backend/
│   ├── main.py             # FastAPI app + all route definitions
│   ├── providers/          # Data-fetching and analysis modules
│   ├── pentest/            # Active probe modules (osint_rework only)
│   ├── tools/              # External CLI tool wrappers (kali_pentest only)
│   ├── services/           # Business logic, job queue (kali_pentest only)
│   └── models/             # Pydantic request/response schemas
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
└── requirements.txt
```

`f1_telemetry` intentionally diverges from this pattern — it uses raw `asyncio` sockets instead of FastAPI/Uvicorn and has no pywebview dependency, since the dashboard is accessed over the network rather than in a native window.

---

##  Legal & Ethical Notice

These tools are intended for **authorized security research, CTF environments, and lab use only**. Running active scans, exploit probes, or packet sniffers against systems you do not own or have explicit written permission to test may be **illegal** in your jurisdiction. Always obtain proper authorization before use.

---
