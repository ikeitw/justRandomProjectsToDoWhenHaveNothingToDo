# database.py
# SQLite persistence layer for F1 25 telemetry
# Uses only the Python standard library (sqlite3)
#
# Schema
# ------
# sessions — one row per game session (track, type, date)
# laps     — one row per completed lap, linked to a session
#
# Fixes applied
# ---------------
# 1. record_lap() accepts fuel_kg=None (stored as SQL NULL) instead of
#    defaulting to 0.0 when CarStatus hasn't arrived yet.
# 2. sector3 derivation is None-safe: only computed when both s1 and s2
#    are positive integers; otherwise stored as NULL.
# 3. total_laps column accepts NULL (practice/quali sessions pass None).

import sqlite3
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

log = logging.getLogger("f1.db")

# Resolved in init_db()
_DB_PATH: Optional[Path] = None
_conn: Optional[sqlite3.Connection] = None


# database schema

_SCHEMA = """
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_uid     TEXT    UNIQUE NOT NULL,   -- F1 25 internal UID (hex)
    track           TEXT    NOT NULL,
    session_type    TEXT    NOT NULL,
    total_laps      INTEGER,                   -- NULL for practice/quali
    track_length_m  INTEGER,
    started_at      TEXT    NOT NULL,          -- ISO-8601 UTC
    ended_at        TEXT,                      -- filled on close
    weather         TEXT
);

CREATE TABLE IF NOT EXISTS laps (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id      INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    lap_number      INTEGER NOT NULL,
    lap_time_ms     INTEGER,                   -- NULL if lap not finished yet
    sector1_ms      INTEGER,                   -- NULL if not captured
    sector2_ms      INTEGER,                   -- NULL if not captured
    sector3_ms      INTEGER,                   -- derived: lap - s1 - s2, NULL if s1/s2 missing
    tyre_compound   TEXT,
    tyre_age_laps   INTEGER,
    is_valid        INTEGER NOT NULL DEFAULT 1,-- 0 = invalid (track limits etc.)
    is_fastest      INTEGER NOT NULL DEFAULT 0,-- 1 = fastest in session
    pit_stop_after  INTEGER NOT NULL DEFAULT 0,-- 1 = pitted after this lap
    fuel_kg         REAL,                      -- NULL if CarStatus not yet received
    recorded_at     TEXT    NOT NULL,
    UNIQUE(session_id, lap_number)
);

CREATE INDEX IF NOT EXISTS idx_laps_session  ON laps(session_id);
CREATE INDEX IF NOT EXISTS idx_laps_time     ON laps(lap_time_ms);
"""


# initialize database

def init_db(project_root: Path) -> None:
    """Open (or create) the SQLite database and apply the schema."""
    global _DB_PATH, _conn

    _DB_PATH = project_root / "f1_telemetry.db"
    _conn = sqlite3.connect(str(_DB_PATH), check_same_thread=False)
    _conn.row_factory = sqlite3.Row
    _conn.executescript(_SCHEMA)
    _conn.commit()
    log.info(f"Database ready: {_DB_PATH}")


def _db() -> sqlite3.Connection:
    if _conn is None:
        raise RuntimeError("Database not initialised — call init_db() first")
    return _conn


# session management

def upsert_session(
    uid: str,
    track: str,
    session_type: str,
    total_laps: Optional[int],   # None for practice/quali
    track_length_m: int,
    weather: str,
) -> int:
    """
    Insert a new session row or return the existing row id if we've seen
    this session UID before (e.g. server restarted mid-session).
    Returns the integer session id.
    """
    db = _db()
    row = db.execute(
        "SELECT id FROM sessions WHERE session_uid = ?", (uid,)
    ).fetchone()

    if row:
        db.execute(
            """UPDATE sessions
               SET track=?, session_type=?, total_laps=?,
                   track_length_m=?, weather=?
               WHERE session_uid=?""",
            (track, session_type, total_laps, track_length_m, weather, uid),
        )
        db.commit()
        return row["id"]

    cur = db.execute(
        """INSERT INTO sessions
           (session_uid, track, session_type, total_laps, track_length_m,
            started_at, weather)
           VALUES (?,?,?,?,?,?,?)""",
        (uid, track, session_type, total_laps, track_length_m,
         _now(), weather),
    )
    db.commit()
    log.info(f"New session started: {track} — {session_type} (id={cur.lastrowid})")
    return cur.lastrowid


def close_session(session_id: int) -> None:
    db = _db()
    db.execute(
        "UPDATE sessions SET ended_at=? WHERE id=?",
        (_now(), session_id),
    )
    db.commit()
    log.info(f"Session {session_id} closed")


# lap recording and queries

def record_lap(
    session_id: int,
    lap_number: int,
    lap_time_ms: int,
    sector1_ms: int,
    sector2_ms: int,
    tyre_compound: str,
    tyre_age_laps: int,
    is_valid: bool,
    pit_stop_after: bool,
    fuel_kg: Optional[float],   # None when CarStatus hasn't arrived yet
) -> None:
    """
    Insert or replace a lap row.
    Sector 3 is derived as lap_time - s1 - s2 only when both s1 and s2
    are positive; otherwise stored as NULL.
    Also updates is_fastest flag across all laps in the session.
    """
    if lap_time_ms <= 0:
        return  # not a real lap yet

    # Derive S3 only when we have real S1 and S2 values
    if sector1_ms and sector1_ms > 0 and sector2_ms and sector2_ms > 0:
        s3: Optional[int] = lap_time_ms - sector1_ms - sector2_ms
        # Sanity check — if S3 comes out negative the sectors are corrupt
        if s3 <= 0:
            s3 = None
    else:
        s3 = None

    # Store 0-values as NULL so they're clearly "not recorded" in queries
    s1 = sector1_ms if sector1_ms and sector1_ms > 0 else None
    s2 = sector2_ms if sector2_ms and sector2_ms > 0 else None

    db = _db()
    db.execute(
        """INSERT INTO laps
           (session_id, lap_number, lap_time_ms, sector1_ms, sector2_ms, sector3_ms,
            tyre_compound, tyre_age_laps, is_valid, pit_stop_after, fuel_kg, recorded_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
           ON CONFLICT(session_id, lap_number) DO UPDATE SET
               lap_time_ms   = excluded.lap_time_ms,
               sector1_ms    = excluded.sector1_ms,
               sector2_ms    = excluded.sector2_ms,
               sector3_ms    = excluded.sector3_ms,
               tyre_compound = excluded.tyre_compound,
               tyre_age_laps = excluded.tyre_age_laps,
               is_valid      = excluded.is_valid,
               pit_stop_after= excluded.pit_stop_after,
               fuel_kg       = excluded.fuel_kg""",
        (session_id, lap_number, lap_time_ms, s1, s2, s3,
         tyre_compound, tyre_age_laps, int(is_valid), int(pit_stop_after),
         fuel_kg, _now()),
    )

    # Recalculate the fastest valid lap in this session
    _refresh_fastest(session_id)
    db.commit()


def _refresh_fastest(session_id: int) -> None:
    """Mark the fastest valid lap in a session with is_fastest=1."""
    db = _db()
    db.execute("UPDATE laps SET is_fastest=0 WHERE session_id=?", (session_id,))
    best = db.execute(
        """SELECT id FROM laps
           WHERE session_id=? AND is_valid=1 AND lap_time_ms IS NOT NULL
           ORDER BY lap_time_ms ASC LIMIT 1""",
        (session_id,),
    ).fetchone()
    if best:
        db.execute("UPDATE laps SET is_fastest=1 WHERE id=?", (best["id"],))


# query API (used by HTTP handler)

def get_all_sessions() -> list[dict]:
    rows = _db().execute(
        """SELECT id, track, session_type, total_laps, started_at, ended_at, weather,
                  (SELECT COUNT(*) FROM laps WHERE session_id=sessions.id) AS lap_count,
                  (SELECT MIN(lap_time_ms) FROM laps
                   WHERE session_id=sessions.id AND is_valid=1) AS best_lap_ms
           FROM sessions
           ORDER BY started_at DESC"""
    ).fetchall()
    return [dict(r) for r in rows]


def get_session(session_id: int) -> Optional[dict]:
    row = _db().execute(
        "SELECT * FROM sessions WHERE id=?", (session_id,)
    ).fetchone()
    return dict(row) if row else None


def get_laps(session_id: int) -> list[dict]:
    rows = _db().execute(
        """SELECT * FROM laps
           WHERE session_id=?
           ORDER BY lap_number ASC""",
        (session_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def get_best_laps_per_session() -> list[dict]:
    """Return the fastest valid lap for every session — useful for all-time records."""
    rows = _db().execute(
        """SELECT s.id AS session_id, s.track, s.session_type, s.started_at,
                  l.lap_number, l.lap_time_ms, l.sector1_ms, l.sector2_ms,
                  l.sector3_ms, l.tyre_compound
           FROM sessions s
           JOIN laps l ON l.session_id = s.id AND l.is_fastest = 1
           ORDER BY l.lap_time_ms ASC"""
    ).fetchall()
    return [dict(r) for r in rows]


def get_sector_bests(session_id: int) -> dict:
    """Return the best individual sector times for a session."""
    db = _db()
    s1 = db.execute(
        "SELECT MIN(sector1_ms) AS v FROM laps WHERE session_id=? AND is_valid=1 AND sector1_ms IS NOT NULL",
        (session_id,),
    ).fetchone()["v"]
    s2 = db.execute(
        "SELECT MIN(sector2_ms) AS v FROM laps WHERE session_id=? AND is_valid=1 AND sector2_ms IS NOT NULL",
        (session_id,),
    ).fetchone()["v"]
    s3 = db.execute(
        "SELECT MIN(sector3_ms) AS v FROM laps WHERE session_id=? AND is_valid=1 AND sector3_ms IS NOT NULL",
        (session_id,),
    ).fetchone()["v"]
    theoretical = (s1 or 0) + (s2 or 0) + (s3 or 0)
    return {
        "sector1_ms":    s1,
        "sector2_ms":    s2,
        "sector3_ms":    s3,
        "theoretical_ms": theoretical if (s1 and s2 and s3) else None,
    }


# utility helpers

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def ms_to_laptime(ms: Optional[int]) -> str:
    if not ms:
        return "—"
    total_s  = ms // 1000
    ms_part  = ms % 1000
    minutes  = total_s // 60
    seconds  = total_s % 60
    return f"{minutes}:{seconds:02d}.{ms_part:03d}"