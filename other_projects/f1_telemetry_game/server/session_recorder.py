# session_recorder.py
# Watches live telemetry state and persists to SQLite
# - New session detected → INSERT sessions row
# - Lap completed (lap number increments) → INSERT/UPDATE laps row with sector times
# - Server shutdown → mark session ended_at
#
# Key fixes
# ---------
# 1. Sector reset order — pending S1/S2 captured BEFORE new-lap reset
# 2. Tire compound/age — saved at START of lap so pit stops don't corrupt it
# 3. fuel_kg defaults to None (not 0.0) when CarStatus hasn't arrived yet
# 4. total_laps set to None for non-race sessions (Practice/Quali)

import logging
from typing import Optional

from . import database as db

log = logging.getLogger("f1.recorder")

# Session types that have a meaningful fixed lap count
_RACE_TYPES = {"Race", "Race 2", "Race 3"}


class SessionRecorder:

    def __init__(self) -> None:
        self._session_uid:      Optional[str] = None
        self._session_id:       Optional[int] = None
        self._last_lap:         int  = 0
        self._pending_s1_ms:    int  = 0   # S1 time captured while in S2/S3
        self._pending_s2_ms:    int  = 0   # S2 time captured while in S3

        # Shadow values captured at START of each lap so pit stops don't overwrite them
        self._lap_start_compound: str   = "Unknown"
        self._lap_start_tyre_age: int   = 0
        self._lap_start_fuel:     Optional[float] = None

    # public interface

    def on_state_update(self, state: dict) -> None:
        session_data = state.get("session")
        lap_data     = state.get("lap")
        status_data  = state.get("status")

        if not session_data or not lap_data:
            return

        self._maybe_open_session(session_data, state)
        if self._session_id is not None:
            self._snapshot_lap_start(lap_data, status_data)
            self._track_sector_times(lap_data)
            self._maybe_record_lap(lap_data)

    def on_shutdown(self) -> None:
        if self._session_id is not None:
            db.close_session(self._session_id)
            self._session_id = None

    # session detection

    def _maybe_open_session(self, session_data: dict, full_state: dict) -> None:
        uid = full_state.get("session_uid")
        if not uid:
            uid = f"{session_data['trackId']}_{session_data['sessionType']}"

        if uid == self._session_uid:
            return

        log.info(f"New session: {session_data['trackId']} — {session_data['sessionType']}")

        if self._session_id is not None:
            db.close_session(self._session_id)

        self._session_uid        = uid
        self._last_lap           = 0
        self._pending_s1_ms      = 0
        self._pending_s2_ms      = 0
        self._lap_start_compound = "Unknown"
        self._lap_start_tyre_age = 0
        self._lap_start_fuel     = None

        # Only store total_laps for race sessions — practice/quali send 1 or 0
        stype      = session_data.get("sessionType", "Unknown")
        total_laps = session_data.get("totalLaps", 0) if stype in _RACE_TYPES else None

        self._session_id = db.upsert_session(
            uid            = uid,
            track          = session_data.get("trackId", "Unknown"),
            session_type   = stype,
            total_laps     = total_laps,
            track_length_m = session_data.get("trackLength", 0),
            weather        = session_data.get("weather", "Unknown"),
        )

    # lap-start snapshot

    def _snapshot_lap_start(self, lap_data: dict, status_data: Optional[dict]) -> None:
        """
        Snapshot current tire/fuel values when lap counter increments
        so pit stops mid-lap don't corrupt the compound we record for that lap.
        """
        current_lap = lap_data.get("currentLap", 0)
        if current_lap <= self._last_lap:
            return  # same lap — nothing to snapshot

        if status_data:
            self._lap_start_compound = status_data.get("tyreCompound", "Unknown")
            self._lap_start_tyre_age = status_data.get("tyresAgeLaps", 0)
            self._lap_start_fuel     = status_data.get("fuelInTank")   # None if missing

    # sector time tracking

    def _track_sector_times(self, lap_data: dict) -> None:
        """
        Capture sector times while they're live.
        Important: capture BEFORE new-lap reset so values at the currentLap increment
        packet (sector=0) are not wiped before _maybe_record_lap reads them.
        """
        s1_ms = lap_data.get("sector1TimeMS", 0)
        s2_ms = lap_data.get("sector2TimeMS", 0)
        current_lap = lap_data.get("currentLap", 0)
        sector      = lap_data.get("sector", 0)

        # capture while values are live
        if s1_ms > 0 and self._pending_s1_ms == 0:
            self._pending_s1_ms = s1_ms
            log.debug(f"S1 captured: {_ms(s1_ms)}")

        if s2_ms > 0 and self._pending_s2_ms == 0:
            self._pending_s2_ms = s2_ms
            log.debug(f"S2 captured: {_ms(s2_ms)}")

        # reset only after recording
        # The reset happens inside _maybe_record_lap after the DB write
        # We guard against false resets on brand-new lap before any sector data arrives
        if current_lap > self._last_lap and sector == 0:
            # Don't reset — _maybe_record_lap handles cleanup after saving.
            pass

    # lap recording

    def _maybe_record_lap(self, lap_data: dict) -> None:
        """
        A lap completes when currentLap increments.
        At that moment lastLapTimeMS has the final lap time and pending
        sector variables carry the captured S1/S2 times.
        """
        current_lap = lap_data.get("currentLap", 0)

        if current_lap <= 1 or current_lap <= self._last_lap:
            return

        finished_lap = current_lap - 1
        last_lap_ms  = lap_data.get("lastLapTimeMS", 0)

        if last_lap_ms <= 0:
            return   # timing not ready yet

        s1_ms = self._pending_s1_ms
        s2_ms = self._pending_s2_ms
        is_valid = not lap_data.get("lapInvalid", False)

        db.record_lap(
            session_id     = self._session_id,
            lap_number     = finished_lap,
            lap_time_ms    = last_lap_ms,
            sector1_ms     = s1_ms,
            sector2_ms     = s2_ms,
            tyre_compound  = self._lap_start_compound,
            tyre_age_laps  = self._lap_start_tyre_age,
            is_valid       = is_valid,
            pit_stop_after = False,
            fuel_kg        = self._lap_start_fuel,
        )

        log.info(
            f"Lap {finished_lap} saved — "
            f"{lap_data.get('lastLapTime', '?')} "
            f"S1={_ms(s1_ms)} S2={_ms(s2_ms)} S3={_ms(last_lap_ms - s1_ms - s2_ms) if s1_ms and s2_ms else '--'} "
            f"({'VALID' if is_valid else 'INVALID'}) [{self._lap_start_compound}]"
        )

        # Advance lap counter and clear pending sectors
        self._last_lap      = current_lap
        self._pending_s1_ms = 0
        self._pending_s2_ms = 0


def _ms(ms: int) -> str:
    if ms <= 0:
        return "--"
    s = ms // 1000
    return f"{s // 60}:{s % 60:02d}.{ms % 1000:03d}"