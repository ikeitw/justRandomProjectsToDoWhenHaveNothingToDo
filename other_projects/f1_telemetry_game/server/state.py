# state.py
# Single shared state dict that holds the latest parsed telemetry
# All packet parsers write here; the WebSocket broadcaster reads from it

from typing import Any

# live state object - keys: "telemetry", "lap", "status", "damage", "session"
live_state: dict[str, Any] = {}


# merge parsed packet into live state
def update(key: str, data: dict) -> None:
    live_state[key] = data


# return shallow copy of current state for broadcasting
def snapshot() -> dict:
    return dict(live_state)