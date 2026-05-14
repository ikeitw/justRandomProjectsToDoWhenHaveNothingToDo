"""
F1 Dashboard — FastAPI Server
──────────────────────────────
Startup sequence:
  1. Load preloaded track geometry from FastF1 cache (optional, async).
  2. Launch the F1 live client in a background asyncio task.
  3. Every 100 ms, broadcast a full AppState snapshot to all WebSocket clients.

Endpoints:
  GET  /          → serves frontend/index.html
  GET  /snapshot  → single JSON snapshot (REST, for debugging)
  WS   /ws        → live 10 Hz data stream
  POST /demo      → toggle demo mode on/off
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from pathlib import Path
from typing import Set

import fastf1
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from f1_client import F1LiveClient
from state import AppState

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ── FastF1 cache ───────────────────────────────────────────────────────────────
CACHE_DIR = Path(__file__).parent.parent / "ff1_cache"
CACHE_DIR.mkdir(exist_ok=True)
fastf1.Cache.enable_cache(str(CACHE_DIR))

# ── App & shared state ─────────────────────────────────────────────────────────
app   = AppState()
api   = FastAPI(title="F1 Dashboard API", version="1.0.0")

# Path to the frontend folder (one level up from backend/)
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"


# ── Preload track geometry from FastF1 cache ───────────────────────────────────

async def _preload_track() -> None:
    """
    Try to load a recent session's telemetry to seed the track geometry.
    Runs in an executor so it doesn't block the event loop.
    """
    loop = asyncio.get_running_loop()

    def _load() -> list:
        try:
            # Try the most recent GP weekend of the current year
            import datetime
            year = datetime.date.today().year
            schedule = fastf1.get_event_schedule(year, include_testing=False)
            past = schedule[schedule["EventDate"] < str(datetime.date.today())]
            if past.empty:
                return []
            event_name = past.iloc[-1]["EventName"]
            logger.info("Preloading track from: %s %d Race", event_name, year)
            session = fastf1.get_session(year, event_name, "R")
            session.load(telemetry=True, laps=False, weather=False, messages=False)
            pos = session.pos_data
            if not pos:
                return []
            # Take a sample driver and get their position data
            sample_driver = list(pos.keys())[0]
            df = pos[sample_driver]
            x = df["X"].dropna().to_numpy()[::5]
            y = df["Y"].dropna().to_numpy()[::5]
            pts = list(zip(x.tolist(), y.tolist()))
            logger.info("Loaded %d track points.", len(pts))
            return pts
        except Exception as exc:
            logger.warning("Track preload failed: %s", exc)
            return []

    pts = await loop.run_in_executor(None, _load)
    if pts:
        app.set_preloaded_track(pts)


# ── WebSocket connection manager ───────────────────────────────────────────────

class ConnectionManager:
    def __init__(self) -> None:
        self._connections: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.add(ws)
        logger.info("WS client connected  (total: %d)", len(self._connections))

    def disconnect(self, ws: WebSocket) -> None:
        self._connections.discard(ws)
        logger.info("WS client disconnected (total: %d)", len(self._connections))

    async def broadcast(self, payload: str) -> None:
        dead: Set[WebSocket] = set()
        for ws in list(self._connections):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._connections.discard(ws)


manager = ConnectionManager()


# ── Background broadcast task ──────────────────────────────────────────────────

async def _broadcast_loop() -> None:
    """Push a snapshot to every connected client every 100 ms."""
    while True:
        try:
            snapshot = app.get_snapshot()
            payload  = json.dumps(snapshot, default=_json_default)
            await manager.broadcast(payload)
        except Exception as exc:
            logger.debug("Broadcast error: %s", exc)
        await asyncio.sleep(0.10)


def _json_default(obj):
    if isinstance(obj, (np.integer,)):  return int(obj)
    if isinstance(obj, (np.floating,)): return float(obj)
    if isinstance(obj, np.ndarray):     return obj.tolist()
    raise TypeError(f"Not serialisable: {type(obj)}")


# ── Startup / shutdown ─────────────────────────────────────────────────────

@api.on_event("startup")
async def startup() -> None:
    logger.info("✅ Starting F1 Dashboard …")
    logger.info("🔄 Preloading track geometry…")
    asyncio.create_task(_preload_track())
    logger.info("📡 Starting broadcast loop…")
    asyncio.create_task(_broadcast_loop())
    logger.info("🔗 Connecting to F1 Live Timing…")
    client = F1LiveClient(app)
    asyncio.create_task(client.run_forever())
    logger.info("🎬 Dashboard ready!")


# ── HTTP endpoints ─────────────────────────────────────────────────────────────

@api.get("/")
async def serve_frontend():
    idx = FRONTEND_DIR / "index.html"
    return FileResponse(str(idx), media_type="text/html")


@api.get("/snapshot")
async def snapshot():
    return JSONResponse(app.get_snapshot())


@api.post("/demo")
async def toggle_demo():
    with app._lock:
        app.demo_mode = not app.demo_mode
    return {"demo_mode": app.demo_mode}


# ── WebSocket endpoint ─────────────────────────────────────────────────────────

@api.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        # Send an immediate snapshot so the client has data before first broadcast
        snapshot = app.get_snapshot()
        await ws.send_text(json.dumps(snapshot, default=_json_default))
        # Keep the socket alive; broadcast loop does all sending
        while True:
            await ws.receive_text()          # echo any pings from client
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.debug("WS error: %s", exc)
    finally:
        manager.disconnect(ws)


# ── Server entry point ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    HOST = os.getenv("F1_HOST", "0.0.0.0")
    PORT = int(os.getenv("F1_PORT", "8000"))

    logger.info(f"🚀 Starting F1 Dashboard Server")
    logger.info(f"📍 Host: {HOST}:{PORT}")
    logger.info(f"🌐 Open http://localhost:{PORT} in your browser")

    uvicorn.run(
        api,
        host=HOST,
        port=PORT,
        log_level="info"
    )
