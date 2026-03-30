# websocket_server.py
# 1. WebSocket server (WS_PORT) — pushes live JSON to browser dashboards
# 2. HTTP file server (HTTP_PORT) — serves the dashboard/ folder as static files
# 3. REST API (same HTTP_PORT) — /api/* endpoints for history data

import json
import logging
import socket
import threading
from http.server import SimpleHTTPRequestHandler
from http import HTTPStatus
from pathlib import Path
from urllib.parse import urlparse

import websockets
from websockets.server import WebSocketServerProtocol

from .config import WS_PORT, HTTP_PORT
from . import state
from . import database as db

log = logging.getLogger("f1.ws")

_clients: set[WebSocketServerProtocol] = set()


# websocket handlers

async def _ws_handler(websocket: WebSocketServerProtocol) -> None:
    _clients.add(websocket)
    addr = websocket.remote_address
    log.info(f"Dashboard connected from {addr}  ({len(_clients)} total)")
    current = state.snapshot()
    if current:
        try:
            await websocket.send(json.dumps(current))
        except (websockets.ConnectionClosed, OSError):
            pass
    try:
        await websocket.wait_closed()
    finally:
        _clients.discard(websocket)
        log.info(f"Dashboard disconnected ({len(_clients)} remaining)")


async def broadcast() -> None:
    if not _clients:
        return
    msg = json.dumps(state.snapshot())
    dead = set()
    for client in _clients:
        try:
            await client.send(msg)
        except (websockets.ConnectionClosed, OSError):
            dead.add(client)
    _clients.difference_update(dead)


async def start_ws_server() -> websockets.WebSocketServer:
    server = await websockets.serve(_ws_handler, "0.0.0.0", WS_PORT)
    log.info(f"WebSocket server listening on ws://0.0.0.0:{WS_PORT}")
    return server


# HTTP handler — static files + REST API

class _DashboardHandler(SimpleHTTPRequestHandler):
    _dashboard_dir: Path = Path(".")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(self.__class__._dashboard_dir), **kwargs)

    def log_message(self, fmt, *args): pass
    def log_error(self, fmt, *args): log.warning(fmt % args)

    def do_GET(self):
        path = urlparse(self.path).path
        if path.startswith("/api/"):
            self._handle_api(path)
        else:
            super().do_GET()

    def _handle_api(self, path: str) -> None:
        try:
            parts = [p for p in path.split("/") if p]

            if parts == ["api", "sessions"]:
                self._json(db.get_all_sessions())
            elif len(parts) == 3 and parts[1] == "sessions":
                sid = int(parts[2])
                row = db.get_session(sid)
                self._json(row) if row else self._not_found()
            elif len(parts) == 4 and parts[1] == "sessions" and parts[3] == "laps":
                self._json(db.get_laps(int(parts[2])))
            elif len(parts) == 4 and parts[1] == "sessions" and parts[3] == "best-sectors":
                self._json(db.get_sector_bests(int(parts[2])))
            elif parts == ["api", "records"]:
                self._json(db.get_best_laps_per_session())
            else:
                self._not_found()

        except (ValueError, IndexError):
            self._error(400, "Bad request")
        except Exception as exc:
            log.error(f"API error: {exc}")
            self._error(500, str(exc))

    def _json(self, data) -> None:
        body = json.dumps(data, default=str).encode()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _not_found(self) -> None:
        self._error(404, "Not found")

    def _error(self, code: int, msg: str) -> None:
        body = json.dumps({"error": msg}).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def start_http_server(dashboard_dir: Path) -> None:
    """Start HTTP server in a daemon thread — returns immediately."""
    _DashboardHandler._dashboard_dir = dashboard_dir

    def _run():
        import http.server
        try:
            with http.server.HTTPServer(("0.0.0.0", HTTP_PORT), _DashboardHandler) as httpd:
                log.info(f"HTTP server on port {HTTP_PORT}")
                httpd.serve_forever()
        except Exception as exc:
            log.error(f"HTTP server error: {exc}")

    t = threading.Thread(target=_run, daemon=True, name="http-server")
    t.start()


# get local IP for dashboard connection

def get_local_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"