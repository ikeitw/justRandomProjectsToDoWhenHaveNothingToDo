# logger.py — F1 25 Raw Telemetry Logger
# Captures UDP packets from F1 25 and saves decoded data to a JSON file
# Run this INSTEAD of run.py to diagnose parsing issues
#
# Usage: python logger.py
# Output: telemetry_log.json (newline-delimited JSON), telemetry_log.txt (summary)
# Note: JSON file is flushed after every packet so you can inspect it while running

import socket
import struct
import json
from pathlib import Path
from datetime import datetime

# header format
HEADER_FMT = "<HBBBBBQfIIBB"
HEADER_SIZE = struct.calcsize(HEADER_FMT)  # 29 bytes

PACKET_NAMES = {
    0: "Motion", 1: "Session", 2: "LapData", 3: "Event",
    4: "Participants", 5: "CarSetups", 6: "CarTelemetry", 7: "CarStatus",
    8: "FinalClass", 9: "LobbyInfo", 10: "CarDamage", 11: "SessionHistory",
    12: "TyreSets", 13: "MotionEx", 14: "TimeTrial", 15: "LapPositions",
}


# parsing functions

def parse_header(data):
    if len(data) < HEADER_SIZE:
        return None
    v = struct.unpack_from(HEADER_FMT, data, 0)
    return {
        "packetFormat": v[0],
        "gameYear": v[1],
        "packetId": v[5],
        "sessionUID": format(v[6], "016x"),
        "sessionTime": round(float(v[7]), 3),
        "playerCarIndex": v[10],
    }


def parse_car_telemetry_raw(data, player_idx):
    """
    Packet 6 — CarTelemetry
    Per-car struct, player car at offset: HEADER_SIZE + player_idx * per_car_size

    Fields per car (from F1 25 spec):
      uint16  speed
      float   throttle
      float   steer
      float   brake
      float   clutch
      int8    gear
      uint16  engineRPM
      uint8   drs
      uint8   revLightsPercent
      uint16  revLightsBitValue
      uint16[4] brakesTemperature    (RL, RR, FL, FR)
      uint8[4]  tyreSurfaceTemp      (RL, RR, FL, FR)
      uint8[4]  tyreInnerTemp        (RL, RR, FL, FR)
      uint16    engineTemp
      float[4]  tyrePressure         (RL, RR, FL, FR)
      uint8[4]  surfaceType          (RL, RR, FL, FR)
    """
    fmt = "<HffffbHBBH4H4B4BH4f4B"
    size = struct.calcsize(fmt)
    off = HEADER_SIZE + player_idx * size
    if len(data) < off + size:
        return {"error": f"packet too short: {len(data)} < {off + size}"}
    v = struct.unpack_from(fmt, data, off)
    return {
        "_fmt_size": size,
        "_offset": off,
        "speed_kmh": v[0],
        "throttle_raw": v[1],  # 0.0..1.0
        "steer_raw": v[2],  # -1.0..1.0
        "brake_raw": v[3],  # 0.0..1.0
        "clutch_raw": v[4],  # 0.0..1.0
        "gear": v[5],  # int8: -1=R, 0=N, 1-8
        "engineRPM": v[6],
        "drs": v[7],  # 0=off, 1=open
        "revLightsPercent": v[8],  # 0-100
        "revLightsBitValue": v[9],
        "brakesTemp_RRRFL_FR": list(v[10:14]),  # [RL, RR, FL, FR]
        "tyreSurfaceTemp_RLRRFLFR": list(v[14:18]),
        "tyreInnerTemp_RLRRFLFR": list(v[18:22]),
        "engineTemp": v[22],
        "tyrePressure_RLRRFLFR": [round(p, 2) for p in v[23:27]],
        "surfaceType_RLRRFLFR": list(v[27:31]),
    }


def parse_lap_data_raw(data, player_idx):
    """
    Packet 2 — LapData

    Fields per car (from F1 25 spec):
      uint32  lastLapTimeInMS
      uint32  currentLapTimeInMS
      uint16  sector1TimeMSPart
      uint8   sector1TimeMinutesPart
      uint16  sector2TimeMSPart
      uint8   sector2TimeMinutesPart
      uint16  deltaToCarInFrontMSPart
      uint8   deltaToCarInFrontMinutesPart
      uint16  deltaToRaceLeaderMSPart
      uint8   deltaToRaceLeaderMinutesPart
      float   lapDistance
      float   totalDistance
      float   safetyCarDelta
      uint8   carPosition
      uint8   currentLapNum
      uint8   pitStatus
      uint8   numPitStops
      uint8   sector           (0=S1, 1=S2, 2=S3)
      uint8   currentLapInvalid
      uint8   penalties
      uint8   totalWarnings
      uint8   cornerCuttingWarnings
      uint8   numUnservedDriveThroughPens
      uint8   numUnservedStopGoPens
      uint8   gridPosition
      uint8   driverStatus
      uint8   resultStatus
      uint8   pitLaneTimerActive
      uint16  pitLaneTimeInLaneInMS
      uint16  pitStopTimerInMS
      uint8   pitStopShouldServePen
      float   speedTrapFastestSpeed
      uint8   speedTrapFastestLap
    """
    fmt = "<IIHBHBHBHBfffBBBBBBBBBBBBBBHHBfB"
    size = struct.calcsize(fmt)
    off = HEADER_SIZE + player_idx * size
    if len(data) < off + size:
        return {"error": f"packet too short: {len(data)} < {off + size}", "_fmt_size": size}
    v = struct.unpack_from(fmt, data, off)

    def ms_str(ms):
        if ms == 0: return "0:00.000"
        s = ms // 1000
        return f"{s // 60}:{s % 60:02d}.{ms % 1000:03d}"

    s1_ms = int(v[2]) + int(v[3]) * 60000
    s2_ms = int(v[4]) + int(v[5]) * 60000

    return {
        "_fmt_size": size,
        "_offset": off,
        "lastLapTimeMS": v[0],
        "lastLapTime": ms_str(v[0]),
        "currentLapTimeMS": v[1],
        "currentLapTime": ms_str(v[1]),
        "sector1_MS_part": v[2],
        "sector1_min_part": v[3],
        "sector1_total_ms": s1_ms,
        "sector1_time": ms_str(s1_ms),
        "sector2_MS_part": v[4],
        "sector2_min_part": v[5],
        "sector2_total_ms": s2_ms,
        "sector2_time": ms_str(s2_ms),
        "lapDistance_m": round(float(v[10]), 1),
        "totalDistance_m": round(float(v[11]), 1),
        "carPosition": v[13],
        "currentLap": v[14],
        "pitStatus": v[15],  # 0=none,1=pitting,2=in pit
        "numPitStops": v[16],
        "sector": v[17],  # 0=S1, 1=S2, 2=S3
        "lapInvalid": bool(v[18]),
        "penalties_sec": v[19],
        "gridPosition": v[24],
        "driverStatus": v[25],
        "resultStatus": v[26],
        "speedTrapFastest_kmh": round(float(v[31]), 1),
    }


def parse_car_status_raw(data, player_idx):
    """
    Packet 7 — CarStatus

    Fields per car:
      uint8   tractionControl
      uint8   antiLockBrakes
      uint8   fuelMix
      uint8   frontBrakeBias
      uint8   pitLimiterStatus
      float   fuelInTank
      float   fuelCapacity
      float   fuelRemainingLaps
      uint16  maxRPM
      uint16  idleRPM
      uint8   maxGears
      uint8   drsAllowed
      uint16  drsActivationDistance
      uint8   actualTyreCompound
      uint8   visualTyreCompound
      uint8   tyresAgeLaps
      int8    vehicleFiaFlags
      uint16  enginePowerICE
      uint16  enginePowerMGUK
      float   ersStoreEnergy
      uint8   ersDeployMode
      float   ersHarvestedThisLapMGUK
      float   ersHarvestedThisLapMGUH
      float   ersDeployedThisLap
      uint8   networkParachuteActivated
    """
    fmt = "<BBBBBfffHHBBHBBBbHHffffB"
    size = struct.calcsize(fmt)
    off = HEADER_SIZE + player_idx * size
    if len(data) < off + size:
        return {"error": f"packet too short: {len(data)} < {off + size}", "_fmt_size": size}
    v = struct.unpack_from(fmt, data, off)

    COMPOUNDS = {16: "Soft", 17: "Medium", 18: "Hard", 7: "Inter", 8: "Wet",
                 9: "DryC1", 10: "DryC2", 11: "DryC3", 12: "DryC4", 13: "DryC5"}
    ERS_MODES = {0: "None", 1: "Medium", 2: "Hotlap", 3: "Overtake"}

    return {
        "_fmt_size": size,
        "_offset": off,
        "frontBrakeBias_pct": v[3],
        "pitLimiter": bool(v[4]),
        "fuelInTank_kg": round(float(v[5]), 3),
        "fuelCapacity_kg": round(float(v[6]), 3),
        "fuelRemainingLaps": round(float(v[7]), 2),
        "maxRPM": v[8],
        "idleRPM": v[9],
        "maxGears": v[10],
        "drsAllowed": bool(v[11]),
        "actualTyreCompound_id": v[13],
        "visualTyreCompound_id": v[14],
        "tyreCompound_name": COMPOUNDS.get(v[14], f"id={v[14]}"),
        "tyresAgeLaps": v[15],
        "fiaFlags": v[16],  # int8: -1=inv,0=none,1=grn,2=blu,3=yel,4=red
        "ersStoreEnergy_J": round(float(v[19]), 0),
        "ersStore_pct": round(float(v[19]) / 4_000_000 * 100, 1),
        "ersDeployMode_id": v[20],
        "ersDeployMode": ERS_MODES.get(v[20], f"id={v[20]}"),
    }


def parse_session_raw(data):
    """Packet 1 — Session (first fields only)"""
    fmt = "<BBbBHBb"
    size = struct.calcsize(fmt)
    off = HEADER_SIZE
    if len(data) < off + size:
        return {"error": "too short"}
    v = struct.unpack_from(fmt, data, off)
    WEATHER = {0: "Clear", 1: "LightCloud", 2: "Overcast", 3: "LightRain", 4: "HeavyRain", 5: "Storm"}
    TRACKS = {0: "Melbourne", 1: "PaulRicard", 2: "Shanghai", 3: "Bahrain", 4: "Catalunya",
              5: "Monaco", 6: "Montreal", 7: "Silverstone", 8: "Hockenheim", 9: "Hungaroring",
              10: "Spa", 11: "Monza", 12: "Singapore", 13: "Suzuka", 14: "AbuDhabi", 15: "COTA",
              16: "Brazil", 17: "Austria", 18: "Sochi", 19: "Mexico", 20: "Baku", 21: "BahrainShort",
              22: "SilverstoneShort", 23: "COTAShort", 24: "SuzukaShort", 25: "Hanoi",
              26: "Zandvoort", 27: "Imola", 28: "Portimao", 29: "Jeddah", 30: "Miami",
              31: "LasVegas", 32: "Losail"}
    return {
        "weather": WEATHER.get(v[0], f"id={v[0]}"),
        "trackTemp_C": v[1],
        "airTemp_C": v[2],
        "totalLaps": v[3],
        "trackLength_m": v[4],
        "sessionType": v[5],
        "trackId": TRACKS.get(v[6], f"id={v[6]}"),
    }


# main logger loop

def main():
    out_path = Path("telemetry_log.json")
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("0.0.0.0", 20777))

    print(f"F1 25 Logger — listening on UDP 20777")
    print(f"Writing to: {out_path.resolve()}")
    print("Waiting for packets... Press Ctrl+C to stop.\n")

    # Track latest session + lap data so we can print a summary
    latest = {}
    packet_count = 0

    with open(out_path, "w") as f:
        try:
            while True:
                data, addr = sock.recvfrom(4096)
                hdr = parse_header(data)
                if not hdr:
                    continue

                pid = hdr["packetId"]
                pidx = hdr["playerCarIndex"]
                pname = PACKET_NAMES.get(pid, f"Unknown({pid})")
                packet_count += 1

                record = {
                    "ts": datetime.now().isoformat(),
                    "packet": pname,
                    "packetId": pid,
                    "playerIdx": pidx,
                    "size": len(data),
                    "header": hdr,
                }

                if pid == 6:  # CarTelemetry
                    record["carTelemetry"] = parse_car_telemetry_raw(data, pidx)
                    latest["telemetry"] = record["carTelemetry"]

                elif pid == 2:  # LapData
                    record["lapData"] = parse_lap_data_raw(data, pidx)
                    latest["lap"] = record["lapData"]

                elif pid == 7:  # CarStatus
                    record["carStatus"] = parse_car_status_raw(data, pidx)
                    latest["status"] = record["carStatus"]

                elif pid == 1:  # Session
                    record["session"] = parse_session_raw(data)
                    latest["session"] = record["session"]

                else:
                    # Skip other packets — they're not needed for diagnosis
                    continue

                # Write one JSON line
                f.write(json.dumps(record) + "\n")
                f.flush()

                # Print a live summary every 60 packets (~3 sec at 20Hz)
                if packet_count % 60 == 0:
                    _print_summary(latest, packet_count)

        except KeyboardInterrupt:
            print(f"\n\nStopped. {packet_count} packets captured.")
            print(f"Log saved to: {out_path.resolve()}")
            _print_summary(latest, packet_count)


def _print_summary(latest, count):
    t = latest.get("telemetry", {})
    l = latest.get("lap", {})
    s = latest.get("status", {})
    ss = latest.get("session", {})

    print(f"\n── #{count} ─────────────────────────────────────────────")
    if ss:
        print(f"  Track: {ss.get('trackId', '?')}  Weather: {ss.get('weather', '?')}  "
              f"TrackTemp: {ss.get('trackTemp_C', '?')}°C")
    if l:
        print(f"  Lap:   {l.get('currentLap', '?')}  "
              f"Pos: {l.get('carPosition', '?')}  "
              f"Sector: S{l.get('sector', 0) + 1}  "
              f"Invalid: {l.get('lapInvalid', '?')}")
        print(f"  Times: current={l.get('currentLapTime', '?')}  "
              f"last={l.get('lastLapTime', '?')}")
        print(f"  S1={l.get('sector1_time', '?')} (MS={l.get('sector1_MS_part', '?')}, "
              f"min={l.get('sector1_min_part', '?')})  "
              f"S2={l.get('sector2_time', '?')} (MS={l.get('sector2_MS_part', '?')}, "
              f"min={l.get('sector2_min_part', '?')})")
    if t:
        print(f"  Speed: {t.get('speed_kmh', '?')} km/h  "
              f"Gear: {t.get('gear', '?')}  "
              f"RPM: {t.get('engineRPM', '?')}  "
              f"DRS: {t.get('drs', '?')}")
        print(f"  Throttle: {round(t.get('throttle_raw', 0) * 100, 1)}%  "
              f"Brake: {round(t.get('brake_raw', 0) * 100, 1)}%  "
              f"Steer: {round(t.get('steer_raw', 0) * 100, 1)}")
        print(f"  TyreSurf(RL/RR/FL/FR): {t.get('tyreSurfaceTemp_RLRRFLFR', '?')}")
        print(f"  TyreInner(RL/RR/FL/FR):{t.get('tyreInnerTemp_RLRRFLFR', '?')}")
        print(f"  BrakeTemp(RL/RR/FL/FR):{t.get('brakesTemp_RRRFL_FR', '?')}")
        print(f"  TyrePressure:           {t.get('tyrePressure_RLRRFLFR', '?')}")
        print(f"  EngineTemp: {t.get('engineTemp', '?')}°C  "
              f"RevLights: {t.get('revLightsPercent', '?')}%")
    if s:
        print(f"  Compound: {s.get('tyreCompound_name', '?')} "
              f"(actual_id={s.get('actualTyreCompound_id', '?')}, "
              f"visual_id={s.get('visualTyreCompound_id', '?')})  "
              f"Age: {s.get('tyresAgeLaps', '?')} laps")
        print(f"  Fuel: {s.get('fuelInTank_kg', '?')} kg  "
              f"Remaining: {s.get('fuelRemainingLaps', '?')} laps  "
              f"ERS: {s.get('ersStore_pct', '?')}% ({s.get('ersDeployMode', '?')})")
        print(f"  MaxRPM: {s.get('maxRPM', '?')}  IdleRPM: {s.get('idleRPM', '?')}")
        print(f"  FiaFlags: {s.get('fiaFlags', '?')}  "
              f"BrakeBias: {s.get('frontBrakeBias_pct', '?')}%")
    print()


if __name__ == "__main__":
    main()