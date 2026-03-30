# udp_listener.py
# Async UDP socket that receives F1 25 telemetry
# Parses packets, updates live state, triggers recorder and WS broadcast

import asyncio
import socket
import logging
from typing import Callable, Awaitable

from .config import (
    UDP_IP, UDP_PORT,
    PKT_TELEMETRY, PKT_LAP_DATA, PKT_CAR_STATUS, PKT_CAR_DAMAGE, PKT_SESSION,
)
from .packet_parser import (
    parse_header,
    parse_car_telemetry,
    parse_lap_data,
    parse_car_status,
    parse_car_damage,
    parse_session,
)
from . import state
from .session_recorder import SessionRecorder

log = logging.getLogger("f1.udp")

BroadcastCallback = Callable[[], Awaitable[None]]

# One recorder instance for the lifetime of the server
_recorder = SessionRecorder()


def _recv_blocking(sock: socket.socket) -> bytes:
    data, _ = sock.recvfrom(4096)
    return data


async def listen(on_update: BroadcastCallback) -> None:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind((UDP_IP, UDP_PORT))
    sock.setblocking(False)
    log.info(f"UDP listener bound to {UDP_IP}:{UDP_PORT}")

    loop = asyncio.get_running_loop()

    PARSERS = {
        PKT_TELEMETRY:  ("telemetry", parse_car_telemetry, True),
        PKT_LAP_DATA:   ("lap",       parse_lap_data,      True),
        PKT_CAR_STATUS: ("status",    parse_car_status,    True),
        PKT_CAR_DAMAGE: ("damage",    parse_car_damage,    True),
        PKT_SESSION:    ("session",   parse_session,       False),
    }

    while True:
        try:
            raw = await loop.run_in_executor(None, lambda: _recv_blocking(sock))
        except OSError as exc:
            # Socket error — wait a bit and retry, do NOT exit the loop
            log.debug(f"UDP recv error: {exc}")
            await asyncio.sleep(0.1)
            continue
        except Exception as exc:
            log.debug(f"UDP unexpected error: {exc}")
            await asyncio.sleep(0.1)
            continue

        header = parse_header(raw)
        if not header:
            continue

        pid  = header["packetId"]
        pidx = header["playerCarIndex"]

        # Store session UID in live state so recorder can read it
        if header.get("sessionUID"):
            state.live_state["session_uid"] = format(header["sessionUID"], "016x")

        if pid not in PARSERS:
            continue

        key, parser_fn, needs_idx = PARSERS[pid]

        try:
            parsed = parser_fn(raw, pidx) if needs_idx else parser_fn(raw)
        except Exception as exc:
            log.debug(f"Parse error for packet {pid}: {exc}")
            continue

        if parsed:
            state.update(key, parsed)
            # Let the recorder inspect the latest full state
            _recorder.on_state_update(state.snapshot())
            await on_update()


# mark session ended on server shutdown
def shutdown_recorder() -> None:
    _recorder.on_shutdown()