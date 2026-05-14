"""
Shared application state — thread-safe storage for all live F1 data.
Accessed by both the F1 live client (writer) and WebSocket broadcaster (reader).
Includes coordinate transformation for canvas rendering and LERP support.
"""

import threading
import time
import numpy as np
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Tuple


# ── Data models ────────────────────────────────────────────────────────────────

@dataclass
class DriverInfo:
    number: str = ""
    abbreviation: str = "???"
    full_name: str = ""
    team_name: str = ""
    team_colour: str = "#FFFFFF"
    headshot_url: str = ""


@dataclass
class CarPosition:
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0
    status: int = 0       # 0=offtrack/pit, 1=on track
    timestamp: float = field(default_factory=time.time)


@dataclass
class SectorTime:
    value: str = ""
    status: str = ""      # "" | "PersonalFastest" | "OverallFastest" | "Slower"


@dataclass
class TimingEntry:
    position: int = 99
    gap_to_leader: str = ""
    interval: str = ""
    last_lap_time: str = ""
    last_lap_personal_best: bool = False
    best_lap_time: str = ""
    sectors: List[SectorTime] = field(default_factory=lambda: [SectorTime(), SectorTime(), SectorTime()])
    compound: str = "UNKNOWN"   # SOFT | MEDIUM | HARD | INTERMEDIATE | WET
    tyre_age: int = 0
    stint_number: int = 1
    in_pit: bool = False
    pit_out: bool = False
    stopped: bool = False
    retired: bool = False
    laps_completed: int = 0
    position_change: int = 0    # positive = gained positions
    drs: bool = False
    speed: int = 0


# ── Colour helpers ─────────────────────────────────────────────────────────────

TEAM_COLOURS: Dict[str, str] = {
    "Red Bull Racing":   "#3671C6",
    "McLaren":           "#FF8000",
    "Ferrari":           "#E8002D",
    "Mercedes":          "#27F4D2",
    "Aston Martin":      "#229971",
    "Alpine":            "#0093CC",
    "Haas F1 Team":      "#B6BABD",
    "RB":                "#6692FF",
    "Williams":          "#64C4FF",
    "Kick Sauber":       "#52E252",
}

COMPOUND_COLOURS: Dict[str, str] = {
    "SOFT":         "#E8002D",
    "MEDIUM":       "#FFF200",
    "HARD":         "#EBEBEB",
    "INTERMEDIATE": "#39B54A",
    "WET":          "#0067FF",
    "UNKNOWN":      "#888888",
}

TRACK_STATUS_LABELS: Dict[str, str] = {
    "1": "Track Clear",
    "2": "Yellow Flag",
    "4": "Safety Car",
    "5": "Red Flag",
    "6": "Virtual SC",
    "7": "Virtual SC End",
}

TRACK_STATUS_COLOURS: Dict[str, str] = {
    "1": "#39B54A",
    "2": "#FFF200",
    "4": "#FF6600",
    "5": "#E8002D",
    "6": "#FF6600",
    "7": "#FFF200",
}


# ── Coordinate transformation for canvas rendering ────────────────────────────

class CoordinateTransformer:
    """
    Transforms F1 world coordinates (mm) to canvas pixel coordinates.
    Handles bounding box calculation, scaling, and padding.
    """

    def __init__(self, canvas_width: int = 1200, canvas_height: int = 800, padding: int = 40):
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        self.padding = padding

        self.min_x = 0.0
        self.max_x = 1.0
        self.min_y = 0.0
        self.max_y = 1.0
        self.scale = 1.0

    def compute_bounds(self, points: List[Tuple[float, float]]):
        """Compute bounding box and scale from track points"""
        if not points or len(points) < 2:
            return

        points_array = np.array(points)
        self.min_x = float(np.min(points_array[:, 0]))
        self.max_x = float(np.max(points_array[:, 0]))
        self.min_y = float(np.min(points_array[:, 1]))
        self.max_y = float(np.max(points_array[:, 1]))

        width = self.max_x - self.min_x
        height = self.max_y - self.min_y

        available_width = self.canvas_width - 2 * self.padding
        available_height = self.canvas_height - 2 * self.padding

        if width > 0 and height > 0:
            self.scale = min(available_width / width, available_height / height)
        else:
            self.scale = 1.0

    def transform(self, x: float, y: float) -> Tuple[float, float]:
        """Transform world (mm) coordinates to canvas (pixel) coordinates"""
        norm_x = (x - self.min_x) / max(self.max_x - self.min_x, 1)
        norm_y = (y - self.min_y) / max(self.max_y - self.min_y, 1)

        canvas_x = self.padding + norm_x * (self.canvas_width - 2 * self.padding)
        canvas_y = self.padding + norm_y * (self.canvas_height - 2 * self.padding)

        return (canvas_x, canvas_y)


# ── Main state container ───────────────────────────────────────────────────────

class AppState:
    """
    Central store for all session data.  Thread-safe via a single RLock.
    The F1 client calls update_* methods; the broadcaster calls get_snapshot().
    """

    def __init__(self):
        self._lock = threading.RLock()

        # Core data
        self.drivers:    Dict[str, DriverInfo]  = {}
        self.positions:  Dict[str, CarPosition] = {}
        self.timing:     Dict[str, TimingEntry] = {}

        # Track geometry — accumulated car coordinates (mm units)
        self.track_points: List[Tuple[float, float]] = []
        self._track_set: set = set()              # dedup by rounded bucket
        self.track_loaded: bool = False           # True once preloaded geometry exists

        # Coordinate transformation for canvas rendering
        self.transformer = CoordinateTransformer(canvas_width=1200, canvas_height=800)

        # Session metadata
        self.session_name:   str = "Miami Grand Prix"
        self.session_type:   str = "Race"
        self.session_status: str = "Started"
        self.track_status:   str = "1"
        self.lap_count:      int = 0
        self.total_laps:     int = 57
        self.weather: dict = {
            "AirTemp": "--", "TrackTemp": "--",
            "WindSpeed": "--", "Humidity": "--",
            "Rainfall": False,
        }

        self.demo_mode: bool = False
        self.last_update: float = time.time()

    # ── Writers (called from F1 client thread) ─────────────────────────────────

    def set_driver(self, number: str, raw: dict):
        with self._lock:
            d = self.drivers.setdefault(number, DriverInfo())
            d.number      = raw.get("RacingNumber", d.number) or number
            d.abbreviation = raw.get("Tla", d.abbreviation)
            d.full_name   = raw.get("FullName", d.full_name)
            d.team_name   = raw.get("TeamName", d.team_name)
            colour = raw.get("TeamColour", "")
            if not colour:
                colour = TEAM_COLOURS.get(d.team_name, "FFFFFF")
            d.team_colour = f"#{colour.lstrip('#')}"

    def set_position(self, number: str, raw: dict):
        with self._lock:
            p = self.positions.setdefault(number, CarPosition())
            new_x = float(raw.get("X", p.x))
            new_y = float(raw.get("Y", p.y))
            p.x = new_x
            p.y = new_y
            p.z = float(raw.get("Z", p.z))
            p.status    = int(raw.get("Status", p.status))
            p.timestamp = time.time()

            # Accumulate track geometry (bucket to ~10m resolution)
            if p.status == 1 and len(self.track_points) < 15_000:
                bucket = (round(new_x / 300) * 300, round(new_y / 300) * 300)
                if bucket not in self._track_set:
                    self._track_set.add(bucket)
                    self.track_points.append((new_x, new_y))

    def set_timing(self, number: str, raw: dict):
        with self._lock:
            t = self.timing.setdefault(number, TimingEntry())

            if "Line" in raw:
                t.position = int(raw["Line"])
            if "Position" in raw:
                try:
                    t.position = int(raw["Position"])
                except (ValueError, TypeError):
                    pass

            for src, dst in [
                ("GapToLeader",              "gap_to_leader"),
                ("IntervalToPositionAhead",  "interval"),
            ]:
                val = raw.get(src, {})
                if isinstance(val, dict):
                    val = val.get("Value", "")
                if val is not None:
                    setattr(t, dst, str(val))

            lap_raw = raw.get("LastLapTime", {})
            if isinstance(lap_raw, dict):
                t.last_lap_time = lap_raw.get("Value", t.last_lap_time)
                t.last_lap_personal_best = (
                    lap_raw.get("PersonalFastest", False) or
                    lap_raw.get("OverallFastest", False)
                )

            best_raw = raw.get("BestLapTime", {})
            if isinstance(best_raw, dict):
                t.best_lap_time = best_raw.get("Value", t.best_lap_time)

            sectors_raw = raw.get("Sectors", [])
            if isinstance(sectors_raw, list):
                for i, s in enumerate(sectors_raw[:3]):
                    if isinstance(s, dict):
                        t.sectors[i].value = s.get("Value", t.sectors[i].value)
                        if s.get("OverallFastest"):
                            t.sectors[i].status = "OverallFastest"
                        elif s.get("PersonalFastest"):
                            t.sectors[i].status = "PersonalFastest"
                        else:
                            t.sectors[i].status = "Slower" if t.sectors[i].value else ""
            elif isinstance(sectors_raw, dict):
                for i, (_, s) in enumerate(list(sectors_raw.items())[:3]):
                    if isinstance(s, dict):
                        t.sectors[i].value = s.get("Value", t.sectors[i].value)

            if raw.get("InPit"):
                t.in_pit = True
            if raw.get("PitOut"):
                t.in_pit = False
                t.pit_out = True
            if raw.get("Stopped"):
                t.stopped = True
            if raw.get("KnockedOut") or raw.get("Retired"):
                t.retired = True

            t.laps_completed = int(raw.get("NumberOfLaps", t.laps_completed) or t.laps_completed)
            t.drs = bool(raw.get("DRS", t.drs))

    def set_tyre(self, number: str, stint: dict):
        with self._lock:
            t = self.timing.setdefault(number, TimingEntry())
            t.compound   = stint.get("Compound", t.compound) or t.compound
            t.tyre_age   = int(stint.get("TotalLaps", t.tyre_age) or t.tyre_age)
            t.stint_number = int(stint.get("StintNumber", t.stint_number) or t.stint_number)

    def set_preloaded_track(self, points: List[Tuple[float, float]]):
        with self._lock:
            self.track_points = points
            self.track_loaded = True

    # ── Reader (called from async broadcast loop) ──────────────────────────────

    def get_snapshot(self) -> dict:
        with self._lock:
            # Recompute bounds if track has updated
            if self.track_points and not self.track_loaded:
                self.transformer.compute_bounds(self.track_points)

            drivers_out = {}
            for num, d in self.drivers.items():
                drivers_out[num] = asdict(d)

            positions_out = {}
            for num, p in self.positions.items():
                pos_dict = asdict(p)
                # Add transformed canvas coordinates
                canvas_x, canvas_y = self.transformer.transform(p.x, p.y)
                pos_dict["canvas_x"] = canvas_x
                pos_dict["canvas_y"] = canvas_y
                positions_out[num] = pos_dict

            timing_out = {}
            for num, t in self.timing.items():
                entry = asdict(t)
                entry["sectors"] = [asdict(s) for s in t.sectors]
                timing_out[num] = entry

            return {
                "drivers":        drivers_out,
                "positions":      positions_out,
                "timing":         timing_out,
                "track_points":   self.track_points,
                "track_loaded":   self.track_loaded,
                "session_name":   self.session_name,
                "session_type":   self.session_type,
                "session_status": self.session_status,
                "track_status":   self.track_status,
                "track_status_label":  TRACK_STATUS_LABELS.get(self.track_status, ""),
                "track_status_colour": TRACK_STATUS_COLOURS.get(self.track_status, "#39B54A"),
                "lap_count":      self.lap_count,
                "total_laps":     self.total_laps,
                "weather":        self.weather,
                "demo_mode":      self.demo_mode,
                "server_time":    time.time(),
                "compound_colours": COMPOUND_COLOURS,
                "canvas_bounds": {
                    "width": self.transformer.canvas_width,
                    "height": self.transformer.canvas_height,
                    "min_x": self.transformer.min_x,
                    "max_x": self.transformer.max_x,
                    "min_y": self.transformer.min_y,
                    "max_y": self.transformer.max_y,
                },
            }