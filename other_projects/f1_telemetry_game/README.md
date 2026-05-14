# F1 25 · Live Telemetry Dashboard

Real-time racing dashboard for **F1 25**, inspired by [f1-dash.com](https://f1-dash.com).
Open it on your PC, phone, or tablet — any browser on the same network.

---

## Features

- **Live telemetry overlay** — speed, throttle, brake, gear, DRS, ERS mode, and tyre temperatures streamed in real time
- **Session history** — every completed lap is persisted to a local SQLite database with sector times, tyre compound, tyre age, pit stops, and fuel load
- **Multi-device** — the dashboard is served over HTTP so you can pull it up on your phone or tablet while playing
- **Auto-reconnect** — the browser WebSocket client reconnects automatically if the server restarts
- **Graceful shutdown** — `Ctrl+C` (or `SIGTERM`) always writes the `ended_at` timestamp so sessions are never left open in the database

---

## Project structure

```
f1_telemetry/
├── run.py                      ← entry point  (python run.py)
├── logger.py                   ← standalone raw-packet logger / debug tool
│
├── server/                     ← Python backend
│   ├── config.py               ← ports, struct formats, lookup tables
│   ├── state.py                ← shared live telemetry state
│   ├── packet_parser.py        ← binary UDP → Python dicts (F1 25 spec)
│   ├── udp_listener.py         ← async UDP socket loop
│   ├── session_recorder.py     ← persists sessions & laps to SQLite
│   ├── database.py             ← SQLite schema and query helpers
│   └── websocket_server.py     ← WebSocket push + HTTP file server
│
└── dashboard/                  ← Frontend (served as static files)
    ├── index.html              ← live telemetry view
    ├── history.html            ← lap history view
    ├── css/
    │   ├── style.css           ← live dashboard styles
    │   └── history.css         ← history page styles
    └── js/
        ├── main.js             ← entry point, wires modules together
        ├── websocket.js        ← WS connection + auto-reconnect
        ├── ui.js               ← DOM update logic
        └── history.js          ← history page logic
```

---

## Quick start

### 1. Install dependencies

```bash
pip install websockets
# or
pip install -r requirements.txt
```

### 2. Configure F1 25

In-game: **Options → Settings → Telemetry Settings**

| Setting | Value |
|---|---|
| UDP Telemetry | **On** |
| UDP IP Address | `127.0.0.1` |
| UDP Port | `20777` |
| UDP Format | **2025** |
| UDP Send Rate | `20Hz` |

> If your game runs on a different PC or console, set the UDP IP to your server PC's LAN IP (e.g. `192.168.1.x`) instead of `127.0.0.1`.

### 3. Run the server

```bash
python run.py
```

You'll see a startup banner:

```
┌────────────────────────────────────────────────────────────┐
│                F1 25  LIVE TELEMETRY SERVER                 │
├────────────────────────────────────────────────────────────┤
│  UDP (game → server)      port 20777                        │
│  WebSocket (live data)    ws://192.168.1.42:8765            │
│  Dashboard + History      http://192.168.1.42:8080          │
│  History page             http://192.168.1.42:8080/history  │
├────────────────────────────────────────────────────────────┤
│  Session data stored in: f1_telemetry.db                    │
└────────────────────────────────────────────────────────────┘
```

### 4. Open the dashboard

| Device | URL |
|---|---|
| Same PC | `http://localhost:8080` |
| Phone / tablet (same Wi-Fi) | `http://<PC-IP>:8080` |
| Lap history | `http://localhost:8080/history.html` |

The status dot turns **green** when live data is flowing.

---

## Ports used

| Port | Protocol | Purpose |
|---|---|---|
| `20777` | UDP | F1 25 → server (telemetry input) |
| `8765` | WebSocket | server → browser (live JSON push) |
| `8080` | HTTP | dashboard + history file server |

---

## Database

Session and lap data are stored automatically in **`f1_telemetry.db`** (SQLite) in the project root. The file is created on first run and grows as you play.

### Schema

**`sessions`** — one row per game session

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | primary key |
| `session_uid` | TEXT | F1 25 internal UID (hex) |
| `track` | TEXT | e.g. `Monza` |
| `session_type` | TEXT | e.g. `Race`, `Practice 1` |
| `total_laps` | INTEGER | NULL for practice / quali |
| `track_length_m` | INTEGER | |
| `started_at` | TEXT | ISO-8601 UTC |
| `ended_at` | TEXT | filled on graceful shutdown |
| `weather` | TEXT | e.g. `Clear`, `Light Rain` |

**`laps`** — one row per completed lap, linked to a session

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | primary key |
| `session_id` | INTEGER | FK → sessions |
| `lap_number` | INTEGER | |
| `lap_time_ms` | INTEGER | NULL if lap unfinished |
| `sector1_ms` | INTEGER | NULL if not captured |
| `sector2_ms` | INTEGER | NULL if not captured |
| `sector3_ms` | INTEGER | derived: lap − s1 − s2 |
| `tyre_compound` | TEXT | e.g. `Soft`, `Medium` |
| `tyre_age_laps` | INTEGER | |
| `is_valid` | INTEGER | 0 = invalidated (track limits) |
| `is_fastest` | INTEGER | 1 = fastest lap in session |
| `pit_stop_after` | INTEGER | 1 = pitted after this lap |
| `fuel_kg` | REAL | NULL if CarStatus not yet received |
| `recorded_at` | TEXT | ISO-8601 UTC |

> `f1_telemetry.db` is excluded from version control via `.gitignore` — see below.

---

## Debugging

Use `logger.py` instead of `run.py` to capture raw packets without running the full server. It writes two files:

- `telemetry_log.json` — newline-delimited JSON, flushed after every packet
- `telemetry_log.txt` — human-readable summary

```bash
python logger.py
```

This is useful for diagnosing parsing issues or verifying your UDP settings.

---

## Troubleshooting

**Dashboard shows "Connecting…" forever**
- Make sure `run.py` is running before opening the dashboard
- Check that Windows Firewall allows Python on ports `8080` and `8765`

**Server starts but no telemetry arrives**
- Confirm *UDP Format* = **2025** (not 2024) in-game
- Confirm you are in an active session, not the main menu

**Phone can't reach the dashboard**
- Phone and PC must be on the same Wi-Fi network
- Firewall must allow inbound connections on port `8080`

**Game runs on a different PC or console**
- Set F1 25 UDP IP to your server PC's LAN IP (e.g. `192.168.1.x`)
- The server already listens on `0.0.0.0` so it accepts all interfaces

---

## License

MIT