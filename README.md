# ️ Security & Network Toolkit — Reworked Apps

A collection of desktop and web-based security, OSINT, network analysis, and personal-project tools. Each project is self-contained; the security/network tools are built with **Python + FastAPI** backends and lightweight HTML/JS or pywebview frontends.

---

## Projects

| Project | Location | Type | Description |
|---|---|---|---|
| [`explorer_rework`](#1-explorer_rework--drill-down-file-system-explorer) | `apps_reworked/` | Desktop App | Cross-platform visual file system explorer |
| [`forensic_file_analyzer`](#2-forensic_file_analyzer--static-file-forensics-tool) | `apps_reworked/` | Desktop App | Static malware triage and IOC detection |
| [`kali_pentest`](#3-kali_pentest--kali-linux-pentest-dashboard) | `apps_reworked/` | Web Dashboard | GUI wrapper for common Kali Linux pentest tools |
| [`network_monitor_rework`](#4-network_monitor_rework--netglass-live-traffic-monitor) | `apps_reworked/` | Desktop App | Live per-process network traffic monitor |
| [`osint_rework`](#5-osint_rework--osint-recon--web-pentest-suite) | `apps_reworked/` | Desktop App | Full OSINT recon + active web pentest suite |
| [`providers_lookup`](#6-providers_lookup--bgp-upstream-provider-lookup) | `apps_reworked/` | CLI Script | BGP upstream provider lookup for a domain |
| [`f1_telemetry_game`](#7-f1_telemetry_game--f1-25-live-telemetry-dashboard) | `other_projects/` | Web Dashboard | Real-time F1 25 racing telemetry dashboard with lap history |
| [`streamix`](#8-streamix--full-stack-movie--tv-streaming-platform) | `other_projects/` | Web App | Full-stack movie & TV streaming platform (Next.js + PostgreSQL + VidAPI + RiveStream) |
| [`f1_telemetry`](#9-f1_telemetry--f1-live-timing-dashboard) | `other_projects/` | Web Dashboard | Real-time F1 live timing dashboard via F1's official SignalR servers + FastF1 |
| [`rds_predict`](#10-rds_predict--russian-drift-series-ai-prediction-server) | `other_projects/` | API Server | RDS GP data + AI prediction server (Express.js + GitHub Models) |

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

> ⚠️ Requires Nmap, Nikto, Gobuster, and SQLMap to be installed on the system. Only use on systems you are authorized to test.

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

> ⚠️ Packet sniffing requires elevated privileges. Run as `root` on Linux/macOS or as Administrator on Windows.

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

> ⚠️ Only use on domains and systems you own or have explicit written authorization to test.

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

## 7. `f1_telemetry_game` — F1 25 Live Telemetry Dashboard

A real-time racing dashboard for **F1 25**, inspired by [f1-dash.com](https://f1-dash.com). Captures UDP telemetry packets broadcast by the game and serves a live dashboard over HTTP — accessible from any browser on the same network, including phones and tablets.

Unlike the `apps_reworked` projects, this one lives under `other_projects/` and uses a pure `asyncio` stack instead of pywebview.

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
other_projects/f1_telemetry_game/
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

## 8. `streamix` — Full-Stack Movie & TV Streaming Platform

A full-stack movie and TV streaming platform built with **Next.js 14**, **PostgreSQL**, **VidAPI**, and the **TMDb API**. Browse thousands of movies and TV series, build a personal watchlist, track watch history, and pick up episodes right where you left off.

> **Educational project.** Movie and series data is sourced from [VidAPI](https://vidapi.ru) and [The Movie Database (TMDb)](https://www.themoviedb.org). Streamix does not host any media files.

### Features

- **Movie & TV Browser** — Hero banner with top popularity films, horizontally scrollable rows for Latest Movies, Latest Series, Top Rated, and 8 genre rows (Action, Comedy, Drama, Thriller, Sci-Fi, Crime, Horror, Adventure)
- **Dedicated Browse Pages** — `/browse/movies` and `/browse/series`: full-page grids with infinite scroll, sort controls (Latest, Trending, Top Rated, A–Z, Z–A, Oldest) and genre filter chips
- **Editorial Pick** — algorithmically chosen highest-rated film highlighted in a full-width editorial block between rows
- **TV Series Support** — season/episode selector on the watch page, "Next Episode" button, and per-season episode grids
- **Search** — full-text search via VidAPI (movies) and TMDb `/search/multi` (TV + movies)
- **Watch Page** — embedded video player via **RiveStream** (`rivestream.pages.dev/embed`); metadata, cast, director, trailer link, and recommendations pulled from TMDb
- **Progress Tracking** — playback position saved automatically; resumes on next visit
- **Watchlist** — Add/remove movies and shows; persisted per user in PostgreSQL
- **Watch History** — full log of every title watched, with timestamps
- **Authentication** — JWT-based auth (register, login, logout) with HTTP-only cookies
- **Route Protection** — middleware guards `/browse` and `/watch` routes; unauthenticated users are redirected to `/login`
- **Responsive UI** — OLED-black design system with CSS custom properties, serif/mono font pairing, collapsible navbar, and skeleton loading states

### Data sources

| Source | Role |
|---|---|
| **VidAPI** (`vidapi.ru`) | Primary catalog — latest movies, latest TV shows, paginated lists with ratings, genres, popularity, and embed URLs |
| **RiveStream** (`rivestream.pages.dev/embed`) | Streaming player — embedded via iframe for both `type=movie` and `type=tv&season=S&episode=E` |
| **TMDb** | Secondary metadata — hero backdrops, watch-page details (overview, cast, director, trailer, similar/recommendations), and search |

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Database | PostgreSQL (via `pg`) |
| Auth | JWT (`jose`) + `bcryptjs` for password hashing |
| Catalog | VidAPI REST JSON |
| Streaming | RiveStream embed |
| Metadata | TMDb REST API |
| Cookie Handling | `cookies-next` |

### Project structure

```
other_projects/streamix/
├── app/
│   ├── page.tsx                  # Root redirect
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles, CSS custom properties, Tailwind base
│   ├── browse/
│   │   ├── page.tsx              # Home: hero + movie/series rows + editorial pick
│   │   ├── layout.tsx            # Browse shell: AuthProvider + Navbar + Footer
│   │   ├── movies/
│   │   │   └── MoviesClient.tsx  # Infinite-scroll grid, sort/genre filters
│   │   ├── series/
│   │   │   └── SeriesClient.tsx  # Same as above, for TV shows
│   │   ├── watchlist/page.tsx    # User's saved titles
│   │   └── history/page.tsx      # User's watch history
│   ├── watch/[id]/
│   │   ├── page.tsx              # Watch page entry (fetches TMDb details server-side)
│   │   └── WatchClient.tsx       # Video player + episode selector + metadata + credits
│   ├── login/                    # Login page
│   ├── register/                 # Register page
│   └── api/
│       ├── auth/login/           # POST — authenticate user, set JWT cookie
│       ├── auth/logout/          # POST — clear JWT cookie
│       ├── auth/register/        # POST — create account
│       ├── auth/me/              # GET  — return current user from session
│       ├── movies/               # GET  — proxy to VidAPI (movies or series, paginated)
│       ├── history/              # GET/POST — watch history CRUD
│       ├── watchlist/            # GET/POST/DELETE — watchlist CRUD
│       └── progress/             # GET/POST — playback progress CRUD
├── components/
│   ├── AuthContext.tsx           # React context: user state, login/logout helpers
│   ├── layout/
│   │   └── Navbar.tsx            # Top navbar + sidebar drawer + search
│   ├── movie/
│   │   ├── HeroBanner.tsx        # Auto-rotating hero (top-5 by popularity, TMDb backdrops)
│   │   ├── MovieRow.tsx          # Horizontally scrollable shelf with eyebrow labels
│   │   ├── MovieCard.tsx         # Poster card with hover overlay and type badge
│   │   └── VideoPlayer.tsx       # RiveStream iframe player
│   └── ui/
│       ├── CTA.tsx               # Polymorphic call-to-action button/link
│       └── Eyebrow.tsx           # Small label chip used above headings
├── lib/
│   ├── vidapi.ts                 # VidAPI + RiveStream client, TMDb search/details
│   ├── db.ts                     # PostgreSQL connection pool + query helpers
│   ├── auth.ts                   # Session helpers: getSession, getUserFromSession
│   ├── jwt.ts                    # signToken / verifyToken (jose)
│   └── streaming.ts              # Legacy streaming URL builders
├── middleware.ts                 # Route protection & auth redirect logic
├── scripts/
│   └── setup-db.js               # Creates all DB tables and indexes
└── .env.local.example            # Environment variable template
```

### Routes

| Route | Access | Description |
|---|---|---|
| `/browse` | Public | Home: hero + curated rows (Latest Movies, Latest Series, Top Rated, genre rows, editorial pick) |
| `/browse/movies` | Public | All movies — infinite scroll grid, sort & genre filter |
| `/browse/series` | Public | All TV series — infinite scroll grid, sort & genre filter |
| `/browse/watchlist` | Protected | User's saved titles |
| `/browse/history` | Protected | User's watch history |
| `/watch/[id]` | Protected | Video player — supports `?type=movie` and `?type=tv&season=S&episode=E` |
| `/login` | Public (redirects if authed) | Login form |
| `/register` | Public (redirects if authed) | Registration form |

#### Browse/Movies and Browse/Series query parameters

| Parameter | Values | Effect |
|---|---|---|
| `sort` | `latest`, `trending`, `rating-desc`, `title-asc`, `title-desc`, `oldest` | Sort order for the grid |
| `genre` | e.g. `Action`, `Drama`, `Comedy` | Filter grid to a single genre |
| `q` | any string | Text search against the loaded catalog |

### How the catalog works

`lib/vidapi.ts` pulls paginated JSON lists from VidAPI:

| Function | VidAPI endpoint | Returns |
|---|---|---|
| `getLatestMovies(page)` | `/movies/latest/page-{n}.json` | `MediaItem[]` (movies) |
| `getLatestShows(page)` | `/tvshows/latest/page-{n}.json` | `MediaItem[]` (TV shows) |
| `getLatestEpisodes(page)` | `/episodes/latest/page-{n}.json` | Raw episode list |
| `getStats()` | `/imdb/api/?action=stats` | Library stats |
| `movieEmbedUrl(tmdbId)` | — | RiveStream `?type=movie&id={id}` |
| `tvEmbedUrl(tmdbId, season, episode)` | — | RiveStream `?type=tv&id={id}&season=S&episode=E` |
| `getTmdbDetails(tmdbId, mediaType)` | TMDb `/movie/{id}` or `/tv/{id}` | Full metadata incl. credits, videos, seasons |
| `searchTmdb(query, page)` | TMDb `/search/multi` | Multi-media search results |

All fetch calls use `next: { revalidate: 3600 }` (1-hour cache).

### Authentication flow

1. User registers via `/register` → password hashed with `bcryptjs` → stored in `users` table
2. User logs in via `/login` → credentials verified → JWT signed with `jose` and stored in an HTTP-only cookie (`streamix-token`)
3. `middleware.ts` intercepts every request to `/browse/watchlist`, `/browse/history`, and `/watch`, verifies the JWT, and redirects unauthenticated users to `/login`
4. Client-side auth state is managed by `AuthContext`, which calls `/api/auth/me` on mount
5. Logout hits `/api/auth/logout`, which clears the cookie

### Database schema

```sql
-- Users
CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,
  avatar       VARCHAR(500),
  plan         VARCHAR(50) DEFAULT 'free',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Watch History
CREATE TABLE watch_history (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  movie_id       INTEGER NOT NULL,
  movie_title    VARCHAR(500) NOT NULL,
  movie_poster   VARCHAR(500),
  movie_backdrop VARCHAR(500),
  movie_rating   DECIMAL(3,1),
  movie_year     INTEGER,
  watched_at     TIMESTAMPTZ DEFAULT NOW(),
  progress       INTEGER DEFAULT 0,
  completed      BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, movie_id)
);

-- Watchlist
CREATE TABLE watchlist (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  movie_id       INTEGER NOT NULL,
  movie_title    VARCHAR(500) NOT NULL,
  movie_poster   VARCHAR(500),
  movie_backdrop VARCHAR(500),
  movie_rating   DECIMAL(3,1),
  movie_year     INTEGER,
  movie_genre    VARCHAR(255),
  added_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);
```

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- A free [TMDb API key](https://www.themoviedb.org/settings/api)

### Run

```bash
cd other_projects/streamix
npm install
cp .env.local.example .env.local
# fill in DATABASE_URL, JWT_SECRET, TMDB_API_KEY in .env.local
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server on port 3000 |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:setup` | Create/migrate database tables |

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

All `apps_reworked` backends share the same project layout:

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

`f1_telemetry_game`, `f1_telemetry`, `streamix`, and `rds_predict` intentionally diverge from this pattern — they use their own stacks suited to their purpose and live under `other_projects/` rather than `apps_reworked/`.

---

## 9. `f1_telemetry` — F1 Live Timing Dashboard

A real-time F1 live timing dashboard that connects directly to **F1's official live timing servers** (`livetiming.formula1.com`) via the SignalR protocol. Shows live car positions, a dynamic track map, and a full leaderboard with sector times, tyres, and gaps — rendered at 60fps in any browser on the local network. Falls back to a built-in 20-car demo simulator when no live session is active.

### How it works

`run.py` starts a FastAPI/Uvicorn server on port 8000. On startup three concurrent tasks are launched:

1. **Track preloader** — uses the **FastF1** library to load cached telemetry from the most recent race weekend, extracting `X`/`Y` position arrays to seed the track geometry before live data arrives.

2. **F1 live client** (`backend/f1_client.py`) — connects to `livetiming.formula1.com` using the SignalR protocol, decompresses the binary payloads, and writes parsed state (positions, timing, sector times, tyre compound/age, weather) into a thread-safe `AppState` object.

3. **Broadcast loop** — runs every 100 ms, serialises `AppState.get_snapshot()` to JSON, and pushes it to every connected WebSocket client.

#### Demo mode

When the live client cannot reach F1 servers (no active session, network issue), `AppState.demo_mode` is set to `True` automatically. The demo simulator populates the state with 20 realistic drivers running on an oval track with lap-time variation, tyre degradation, pit-stop sequences, and weather data. Toggle it manually via `POST /demo`.

#### Frontend (60fps animation)

The single-file dashboard (`frontend/index.html`) uses a **LERP interpolation** loop running at 60fps. The backend sends position updates at 10Hz (100ms intervals); the frontend smoothly interpolates visual car positions each frame using `visual_x += (target_x - visual_x) * LERP_FACTOR` (default 0.12), eliminating stutter between data packets.

The **HTML5 Canvas** track map normalises F1 world coordinates (in millimetres) to canvas pixels, draws the track outline, then renders each car as a coloured dot with the driver's three-letter code.

The **leaderboard** (left panel) updates every 250ms and shows position, gap to leader, last lap time, sector times with fastest-sector highlighting, tyre compound and age, and on-track/pit/retired status. Tyre colours follow F1 official palette: Soft = red, Medium = yellow, Hard = white, Intermediate = green, Wet = blue.

#### Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | Serves `frontend/index.html` |
| `GET /snapshot` | Single JSON snapshot of current `AppState` (debug/REST) |
| `WS /ws` | 10Hz live data stream |
| `POST /demo` | Toggle demo mode on/off |

### Stack

Python · FastAPI · FastF1 · Uvicorn · NumPy · Pandas · Vanilla JS · HTML5 Canvas

### Run

```bash
cd other_projects/f1_telemetry
pip install -r requirements.txt
python run.py
# Open http://localhost:8000
```

### Project structure

```
other_projects/f1_telemetry/
├── run.py                 # Quick-start launcher
├── requirements.txt
├── backend/
│   ├── main.py            # FastAPI server + broadcast loop + WebSocket manager
│   ├── f1_client.py       # F1 SignalR connector + binary decompressor
│   └── state.py           # Thread-safe AppState + demo simulator
└── frontend/
    └── index.html         # Complete dashboard UI + 60fps JS animation
```

---

## 10. `rds_predict` — Russian Drift Series AI Prediction Server

A local **Express.js** server built around the **Russian Drift Series Grand Prix (RDS GP)**. It serves a structured REST API of RDS GP 2025 season data — drivers, teams, cars, tracks, and calendar events — scraped from the official `rdsgp.com` website, and exposes an AI chat endpoint backed by the **GitHub Models API** (`openai/gpt-4.1`) that can answer questions about and generate predictions for the championship.

### How it works

`server.js` mounts two independent route groups:

**RDS GP data layer** (`/api/*`) — serves pre-generated ESM data modules from `src/data/generated/`. These are produced by running `scripts/import-rdsgp-data.js`, which scrapes driver profiles, team listings, and the official season schedule from `rdsgp.com`. Each module carries per-field source metadata: `source_type`, `source_url`, `confidence` (0–1), `extraction_method`, and a `notes` string so consumers know how reliable each value is. Controllers join the arrays at request time (e.g. a driver response embeds the matched team object and car object by ID).

**AI prediction proxy** (`/ai/chat`) — accepts a `POST` with a `message` string and an optional `system` prompt, validates input (length limits up to 32 000 chars, type checks), then forwards to `src/services/githubModelsProvider.js`, which calls the GitHub Models REST endpoint. Intended use: pass the RDS GP data as context and ask the model to predict match-ups, qualification scores, championship standings, or head-to-head outcomes. Requires a bearer token.

Security middleware on all routes: **Helmet.js** security headers, **CORS** (all origins, GET/POST/OPTIONS), **express-rate-limit** (100 req per 15 min per IP).

### RDS GP 2025 season data

#### Drivers

All driver entries are scraped from individual pilot pages on `rdsgp.com`. Each record includes full name (Cyrillic), car number, city, birth date, social links (Instagram, VK, YouTube, Telegram), and career statistics fields (seasons, wins, podiums, win rate, qualification average score). Most career statistics are currently marked `unavailable` — the scraper captures the structure but the official site does not expose historical totals yet.

#### Teams

Includes teams such as Lukoil Racing Drift Team, Fresh Racing, Takayama Forward Auto, TimeUp, Carville Racing, Lecar Oderzhimye Motorsport, Avtoban, and Star Pyor Stars Aimol.

#### Tracks

SVG track geometry with viewBox, path, start/finish points, and clipping-zone polygons. The `telemetryPolicy` field on each track declares whether official telemetry is available — currently all tracks are marked `officialTelemetryAvailable: false`; the SVG paths are manually authored placeholders, not official geometry. Venues include Moscow Raceway, Igora Drive, NRing (Nizhny Novgorod), ADM Raceway, RedRing (Krasnoyarsk), and Rostov Arena.

#### Calendar events (2025)

| Round | Venue | City | Dates |
|---|---|---|---|
| 1 | Moscow Raceway | Москва | 2–3 мая |
| 2 | Igora Drive | Санкт-Петербург | 23–24 мая |
| 3 | NRing | Нижний Новгород | 13–14 июня |
| RDS FEST | Moscow Raceway | Москва | 20 июня |
| 4 | ADM Raceway | Москва | 11–12 июля |
| 5 | RedRing | Красноярск | 1–2 августа |
| RDS FEST | Igora Drive | Санкт-Петербург | 22–23 августа |
| 6 | Moscow Raceway | Москва | 29–30 августа |
| Superfinal | Ростов Арена | Ростов-на-Дону | 26–27 сентября |

### API endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `GET /health` | None | Health check — uptime, provider, version |
| `POST /ai/chat` | Bearer token | AI prediction/analysis via GitHub Models |
| `GET /api/drivers` | None | All RDS GP drivers with joined team and car |
| `GET /api/drivers/:driverId` | None | Single driver with full team and car detail |
| `GET /api/teams` | None | All RDS GP teams |
| `GET /api/cars` | None | All RDS GP cars |
| `GET /api/tracks` | None | All tracks with SVG geometry and telemetry policy |
| `GET /api/events` | None | Full 2025 season calendar with venue, city, dates, status |

#### Example AI prediction request

```json
POST /ai/chat
Authorization: Bearer <APP_BEARER_TOKEN>

{
  "message": "Based on the 2025 RDS GP season calendar, predict which driver is most likely to win the Superfinal at Rostov Arena.",
  "system": "You are an expert Russian Drift Series analyst."
}
```

### Stack

Node.js · Express.js · Helmet.js · GitHub Models API (`openai/gpt-4.1`)

### Project structure

```
other_projects/rds_predict/
├── server.js                              # App entry point
├── package.json
├── .env.example                           # Config template
├── src/
│   ├── config.js                          # Env loader
│   ├── middleware/auth.js                 # Bearer token validation
│   ├── utils/logger.js                    # Secure logging (masks tokens in prod)
│   ├── services/githubModelsProvider.js   # GitHub Models API client
│   ├── controllers/
│   │   ├── aiController.js                # /ai/chat — validates & forwards to provider
│   │   └── healthController.js            # /health
│   ├── routes/
│   │   ├── aiRoutes.js
│   │   └── healthRoutes.js
│   ├── modules/
│   │   ├── drivers/                       # GET /api/drivers[/:id]
│   │   ├── teams/                         # GET /api/teams
│   │   ├── cars/                          # GET /api/cars
│   │   ├── tracks/                        # GET /api/tracks
│   │   └── events/                        # GET /api/events
│   └── data/
│       ├── drivers.data.js                # Source data (manual/curated)
│       ├── tracks.data.js
│       ├── teams.data.js
│       ├── cars.data.js
│       └── generated/                     # Auto-generated from rdsgp.com scrape
│           ├── drivers.generated.js
│           ├── teams.generated.js
│           ├── cars.generated.js
│           ├── tracks.generated.js
│           ├── events.generated.js
│           └── metadata.generated.js
└── scripts/test.js                        # Automated test suite
```

### Setup

```bash
cd other_projects/rds_predict
npm install
cp .env.example .env
# Set APP_BEARER_TOKEN and GITHUB_MODELS_TOKEN in .env
npm start
# Server runs on http://localhost:3000
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `APP_BEARER_TOKEN` | (required) | Token clients must send to `/ai/chat` |
| `GITHUB_MODELS_TOKEN` | (required) | GitHub Personal Access Token with Models access |
| `GITHUB_MODEL` | `openai/gpt-4.1` | Model used for predictions |
| `NODE_ENV` | `development` | Environment |

---

## ⚖️ Legal & Ethical Notice

The security and network tools are intended for **authorized security research, CTF environments, and lab use only**. Running active scans, exploit probes, or packet sniffers against systems you do not own or have explicit written permission to test may be **illegal** in your jurisdiction. Always obtain proper authorization before use.

`streamix` is an **educational project** built for learning purposes. It does not host, store, or distribute any video content. All movie metadata and images are provided by the [TMDb API](https://www.themoviedb.org). This product uses the TMDb API but is not endorsed or certified by TMDb.
