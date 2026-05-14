# run.py — F1 25 Live Telemetry Server
# 
# Key fixes:
# 1. Graceful shutdown via signal handlers (SIGINT/SIGTERM) so sessions always record ended_at
# 2. Shutdown Event properly canceled so asyncio.run() doesn't swallow it

import asyncio
import logging
import signal
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("f1")

from server.config import UDP_PORT, WS_PORT, HTTP_PORT
from server import database as db
from server.websocket_server import broadcast, start_ws_server, start_http_server, get_local_ip
from server.udp_listener import listen, shutdown_recorder

ROOT          = Path(__file__).resolve().parent
DASHBOARD_DIR = ROOT / "dashboard"


def _print_banner(local_ip: str) -> None:
    w = 60
    sep = "─" * w
    print(f"\n┌{sep}┐")
    print(f"│{'F1 25  LIVE TELEMETRY SERVER':^{w}}│")
    print(f"├{sep}┤")
    print(f"│  {'UDP (game → server)':<24} port {UDP_PORT:<27}│")
    print(f"│  {'WebSocket (live data)':<24} ws://{local_ip}:{WS_PORT:<20}│")
    print(f"│  {'Dashboard + History':<24} http://{local_ip}:{HTTP_PORT:<18}│")
    print(f"│  {'History page':<24} http://{local_ip}:{HTTP_PORT}/history.html{'':5}│")
    print(f"├{sep}┤")
    print(f"│  Session data stored in: f1_telemetry.db{' '*(w-42)}│")
    print(f"└{sep}┘\n")


async def main() -> None:
    local_ip = get_local_ip()
    db.init_db(ROOT)
    _print_banner(local_ip)

    if not DASHBOARD_DIR.exists():
        log.error(f"Dashboard folder not found: {DASHBOARD_DIR}")
        sys.exit(1)

    # 1. WebSocket server
    ws_server = await start_ws_server()

    # 2. HTTP server — daemon thread
    start_http_server(DASHBOARD_DIR)

    # 3. UDP listener
    udp_task = asyncio.create_task(listen(on_update=broadcast), name="udp-listener")

    log.info("All services running. Press Ctrl+C to stop.")

    # Shutdown event — set by signal handlers OR KeyboardInterrupt
    shutdown = asyncio.Event()

    def _request_shutdown(sig_name: str = "signal") -> None:
        if not shutdown.is_set():
            log.info(f"Shutdown requested ({sig_name})")
            shutdown.set()

    # Register OS-level signal handlers so SIGTERM (e.g. systemd / Task Manager)
    # also triggers a clean shutdown and writes ended_at.
    loop = asyncio.get_running_loop()
    try:
        loop.add_signal_handler(signal.SIGINT,  lambda: _request_shutdown("SIGINT"))
        loop.add_signal_handler(signal.SIGTERM, lambda: _request_shutdown("SIGTERM"))
    except NotImplementedError:
        # Windows doesn't support add_signal_handler for all signals — fall back
        # to the KeyboardInterrupt path below.
        pass

    try:
        await shutdown.wait()
    except (KeyboardInterrupt, asyncio.CancelledError):
        _request_shutdown("KeyboardInterrupt")

    # shutdown services
    log.info("Shutting down...")

    udp_task.cancel()
    try:
        await udp_task
    except asyncio.CancelledError:
        pass

    # Always write ended_at — this is the fix for sessions with ended_at=None
    shutdown_recorder()

    ws_server.close()
    await ws_server.wait_closed()
    log.info("Server stopped.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass