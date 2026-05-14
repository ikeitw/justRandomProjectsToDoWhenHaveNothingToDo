# packet_parser.py
# Parses raw F1 25 UDP binary packets into clean Python dicts
# All struct formats verified against real packet sizes from live F1 25 data
#
# Key fixes vs original:
#   - CarTelemetry: clutch is uint8 (not float) → 60 bytes/car ✓
#   - CarStatus: enginePowerICE/MGUK are uint32 (not uint16) → 55 bytes/car ✓
#   - LapData: correct 57-byte format including resultStatus field ✓

import struct
from typing import Optional

from .config import (
    HEADER_FMT, HEADER_SIZE,
    CAR_TELEMETRY_FMT, CAR_TELEMETRY_SIZE,
    LAP_DATA_FMT, LAP_DATA_SIZE,
    CAR_STATUS_FMT, CAR_STATUS_SIZE,
    CAR_DAMAGE_FMT, CAR_DAMAGE_SIZE,
    SESSION_FIELDS_FMT, SESSION_FIELDS_SIZE,
    TRACK_NAMES, TYRE_COMPOUNDS, WEATHER_LABELS, ERS_MODES, SESSION_TYPES,
)


# header parsing

def parse_header(data: bytes) -> Optional[dict]:
    if len(data) < HEADER_SIZE:
        return None
    v = struct.unpack_from(HEADER_FMT, data, 0)
    # Indices verified: [5]=packetId, [6]=sessionUID, [7]=sessionTime, [10]=playerCarIndex
    return {
        "packetFormat":            v[0],
        "packetId":                v[5],
        "sessionUID":              v[6],
        "sessionTime":             v[7],
        "playerCarIndex":          v[10],
        "secondaryPlayerCarIndex": v[11],
    }


# helpers

def _ms_to_time(ms: int) -> str:
    if ms <= 0:
        return "--:--.---"
    total_s = ms // 1000
    ms_part = ms % 1000
    return f"{total_s // 60}:{total_s % 60:02d}.{ms_part:03d}"


def _car_offset(player_idx: int, per_car: int) -> int:
    return HEADER_SIZE + player_idx * per_car


# packet 6 — car telemetry (60 bytes/car)

def parse_car_telemetry(data: bytes, player_idx: int) -> Optional[dict]:
    """
    Speed, throttle, brake, clutch (uint8!), steer, gear, RPM,
    DRS, rev lights, tire temps, brake temps, tire pressures.
    """
    offset = _car_offset(player_idx, CAR_TELEMETRY_SIZE)
    if len(data) < offset + CAR_TELEMETRY_SIZE:
        return None
    try:
        v = struct.unpack_from(CAR_TELEMETRY_FMT, data, offset)
    except struct.error:
        return None

    # Index map for "<HfffBbHBBH4H4B4BH4f4B":
    # [0]  speed (uint16, km/h)
    # [1]  throttle (float 0..1)
    # [2]  steer (float -1..1)
    # [3]  brake (float 0..1)
    # [4]  clutch (uint8 0..100)
    # [5]  gear (int8: -1=R, 0=N, 1-8)
    # [6]  engineRPM (uint16)
    # [7]  drs (uint8 0/1)
    # [8]  revLightsPercent (uint8 0-100)
    # [9]  revLightsBitValue (uint16)
    # [10-13] brakesTemp[RL,RR,FL,FR] (uint16 each)
    # [14-17] tyreSurfaceTemp[RL,RR,FL,FR] (uint8 each)
    # [18-21] tyreInnerTemp[RL,RR,FL,FR] (uint8 each)
    # [22] engineTemp (uint16)
    # [23-26] tyrePressure[RL,RR,FL,FR] (float each)
    # [27-30] surfaceType[RL,RR,FL,FR] (uint8 each)
    return {
        "speed":            v[0],
        "throttle":         round(v[1] * 100.0, 1),
        "steer":            round(v[2] * 100.0, 1),   # -100..100
        "brake":            round(v[3] * 100.0, 1),
        "clutch":           v[4],                      # already 0-100 as uint8
        "gear":             int(v[5]),                 # -1=R, 0=N, 1-8
        "rpm":              v[6],
        "drs":              v[7],
        "revLightsPercent": v[8],
        "brakesTemp":       list(v[10:14]),            # [RL, RR, FL, FR]
        "tyreSurfaceTemp":  list(v[14:18]),            # [RL, RR, FL, FR]
        "tyreInnerTemp":    list(v[18:22]),            # [RL, RR, FL, FR]
        "engineTemp":       v[22],
        "tyrePressure":     [round(p, 1) for p in v[23:27]],
    }


# packet 2 — lap data (57 bytes/car)

def parse_lap_data(data: bytes, player_idx: int) -> Optional[dict]:
    """
    Lap timing, sector times, position, pit status, sector indicator.
    """
    offset = _car_offset(player_idx, LAP_DATA_SIZE)
    if len(data) < offset + LAP_DATA_SIZE:
        return None
    try:
        v = struct.unpack_from(LAP_DATA_FMT, data, offset)
    except struct.error:
        return None

    # Index map for "<IIHBHBHBHBfffBBBBBBBBBBBBBBBHHBfB":
    # [0]  lastLapTimeInMS
    # [1]  currentLapTimeInMS
    # [2]  sector1TimeMSPart (uint16)
    # [3]  sector1TimeMinutesPart (uint8)
    # [4]  sector2TimeMSPart (uint16)
    # [5]  sector2TimeMinutesPart (uint8)
    # [6]  deltaToCarInFrontMSPart, [7] min part
    # [8]  deltaToRaceLeaderMSPart, [9] min part
    # [10] lapDistance (float)
    # [11] totalDistance (float)
    # [12] safetyCarDelta (float)
    # [13] carPosition, [14] currentLapNum, [15] pitStatus, [16] numPitStops
    # [17] sector (0=S1, 1=S2, 2=S3)
    # [18] lapInvalid, [19] penalties, [20] totalWarnings, [21] cornerCutWarnings
    # [22] unservedDriveThroughPens, [23] unservedStopGoPens
    # [24] gridPosition, [25] driverStatus, [26] resultStatus
    # [27] pitLaneTimerActive, [28] pitLaneTimeInLaneInMS, [29] pitStopTimerInMS
    # [30] pitStopShouldServePen
    # [31] speedTrapFastestSpeed (float)
    # [32] speedTrapFastestLap (uint8)
    s1_ms = int(v[2]) + int(v[3]) * 60_000
    s2_ms = int(v[4]) + int(v[5]) * 60_000

    return {
        "lastLapTime":      _ms_to_time(v[0]),
        "lastLapTimeMS":    v[0],
        "currentLapTime":   _ms_to_time(v[1]),
        "currentLapTimeMS": v[1],
        "sector1Time":      _ms_to_time(s1_ms),
        "sector1TimeMS":    s1_ms,
        "sector2Time":      _ms_to_time(s2_ms),
        "sector2TimeMS":    s2_ms,
        "lapDistance":      round(float(v[10]), 1),
        "carPosition":      int(v[13]),
        "currentLap":       int(v[14]),
        "pitStatus":        int(v[15]),
        "numPitStops":      int(v[16]),
        "sector":           int(v[17]),    # 0=S1, 1=S2, 2=S3
        "lapInvalid":       bool(v[18]),
        "penalties":        int(v[19]),
        "gridPosition":     int(v[24]),
        "driverStatus":     int(v[25]),
        "resultStatus":     int(v[26]),
        "speedTrapFastest": round(float(v[31]), 1),
    }


# packet 7 — car status (55 bytes/car)

def parse_car_status(data: bytes, player_idx: int) -> Optional[dict]:
    """
    Fuel, ERS, tire compound/age, DRS, flags, pit limiter.
    FIXED: enginePowerICE/MGUK are uint32 (I), not uint16 (H).
    """
    offset = _car_offset(player_idx, CAR_STATUS_SIZE)
    if len(data) < offset + CAR_STATUS_SIZE:
        return None
    try:
        v = struct.unpack_from(CAR_STATUS_FMT, data, offset)
    except struct.error:
        return None

    # Index map for "<BBBBBfffHHBBHBBBbIIfBfffB":
    # [0-4]  uint8 tractionControl, ABS, fuelMix, frontBrakeBias, pitLimiter
    # [5-7]  float fuelInTank, fuelCapacity, fuelRemainingLaps
    # [8-9]  uint16 maxRPM, idleRPM
    # [10]   uint8 maxGears
    # [11]   uint8 drsAllowed
    # [12]   uint16 drsActivationDistance
    # [13]   uint8 actualTyreCompound
    # [14]   uint8 visualTyreCompound
    # [15]   uint8 tyresAgeLaps
    # [16]   int8  vehicleFiaFlags
    # [17]   uint32 enginePowerICE   ← was uint16, now uint32
    # [18]   uint32 enginePowerMGUK  ← was uint16, now uint32
    # [19]   float  ersStoreEnergy (joules, max 4,000,000)
    # [20]   uint8  ersDeployMode (0=None,1=Medium,2=Hotlap,3=Overtake)
    # [21]   float  ersHarvestedThisLapMGUK
    # [22]   float  ersHarvestedThisLapMGUH
    # [23]   float  ersDeployedThisLap
    # [24]   uint8  networkParachuteActivated
    ers_raw = float(v[19])
    ers_pct = round((ers_raw / 4_000_000.0) * 100.0, 1)

    return {
        "fuelInTank":        round(float(v[5]), 2),
        "fuelCapacity":      round(float(v[6]), 2),
        "fuelRemainingLaps": round(float(v[7]), 1),
        "maxRPM":            int(v[8]),
        "idleRPM":           int(v[9]),
        "tyreCompound":      TYRE_COMPOUNDS.get(int(v[14]), f"Compound {v[14]}"),
        "actualCompoundId":  int(v[13]),
        "tyresAgeLaps":      int(v[15]),
        "drsAllowed":        bool(v[11]),
        "pitLimiter":        bool(v[4]),
        "ersStoreKJ":        round(ers_raw / 1000.0, 1),
        "ersPct":            min(max(ers_pct, 0.0), 100.0),
        "ersDeployMode":     ERS_MODES.get(int(v[20]), "Unknown"),
        "frontBrakeBias":    int(v[3]),
        "fiaFlags":          int(v[16]),
    }


# packet 10 — car damage

def parse_car_damage(data: bytes, player_idx: int) -> Optional[dict]:
    offset = _car_offset(player_idx, CAR_DAMAGE_SIZE)
    if len(data) < offset + CAR_DAMAGE_SIZE:
        return None
    try:
        v = struct.unpack_from(CAR_DAMAGE_FMT, data, offset)
    except struct.error:
        return None

    # [0-3]   float tyresWear[RL,RR,FL,FR]
    # [4-7]   uint8 tyresDamage[RL,RR,FL,FR]
    # [8-11]  uint8 brakesDamage[RL,RR,FL,FR]
    # [12]    uint8 frontLeftWingDamage
    # [13]    uint8 frontRightWingDamage
    # [14]    uint8 rearWingDamage
    # [15]    uint8 floorDamage
    # [16]    uint8 diffuserDamage
    # [17]    uint8 sidepodDamage
    # [18]    uint8 drsFault
    # [19]    uint8 ersFault
    # [20]    uint8 gearBoxDamage
    # [21]    uint8 engineDamage
    # [22-28] uint8 engine component wear fields
    return {
        "tyresWear":      [round(float(x), 1) for x in v[0:4]],
        "tyresDamage":    list(v[4:8]),
        "brakesDamage":   list(v[8:12]),
        "frontLeftWing":  int(v[12]),
        "frontRightWing": int(v[13]),
        "rearWing":       int(v[14]),
        "floorDamage":    int(v[15]),
        "diffuserDamage": int(v[16]),
        "gearboxDamage":  int(v[20]),
        "engineDamage":   int(v[21]),
    }


# packet 1 — session data

def parse_session(data: bytes) -> Optional[dict]:
    offset = HEADER_SIZE
    if len(data) < offset + SESSION_FIELDS_SIZE:
        return None
    try:
        v = struct.unpack_from(SESSION_FIELDS_FMT, data, offset)
    except struct.error:
        return None

    return {
        "weather":      WEATHER_LABELS.get(int(v[0]), "Unknown"),
        "trackTemp":    int(v[1]),
        "airTemp":      int(v[2]),
        "totalLaps":    int(v[3]),
        "trackLength":  int(v[4]),
        "sessionType":  SESSION_TYPES.get(int(v[5]), "Unknown"),
        "trackId":      TRACK_NAMES.get(int(v[6]), f"Track {v[6]}"),
    }