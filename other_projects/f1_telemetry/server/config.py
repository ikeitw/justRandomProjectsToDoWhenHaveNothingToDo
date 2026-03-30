# config.py
# Central config for network, packet formats, and lookup tables for F1 25
# All struct formats verified against real F1 25 packets

import struct

# network settings
UDP_IP   = "0.0.0.0"
UDP_PORT = 20777
WS_PORT  = 8765
HTTP_PORT= 8080

# packet header: 29 bytes
HEADER_FMT  = "<HBBBBBQfIIBB"
HEADER_SIZE = struct.calcsize(HEADER_FMT)   # 29 bytes

# packet type IDs
PKT_MOTION       = 0
PKT_SESSION      = 1
PKT_LAP_DATA     = 2
PKT_EVENT        = 3
PKT_PARTICIPANTS = 4
PKT_CAR_SETUPS   = 5
PKT_TELEMETRY    = 6
PKT_CAR_STATUS   = 7
PKT_FINAL_CLASS  = 8
PKT_CAR_DAMAGE   = 10

# car telemetry (packet 6) — 60 bytes per car
CAR_TELEMETRY_FMT  = "<HfffBbHBBH4H4B4BH4f4B"
CAR_TELEMETRY_SIZE = struct.calcsize(CAR_TELEMETRY_FMT)   # 60 bytes

# lap data (packet 2) — 57 bytes per car
LAP_DATA_FMT  = "<IIHBHBHBHBfffBBBBBBBBBBBBBBBHHBfB"
LAP_DATA_SIZE = struct.calcsize(LAP_DATA_FMT)   # 57 bytes

# car status (packet 7) — 55 bytes per car
CAR_STATUS_FMT  = "<BBBBBfffHHBBHBBBbIIfBfffB"
CAR_STATUS_SIZE = struct.calcsize(CAR_STATUS_FMT)   # 55 bytes

# car damage (packet 10)
CAR_DAMAGE_FMT  = "<4f4B4BBBBBBBBBBBBBBBBB"
CAR_DAMAGE_SIZE = struct.calcsize(CAR_DAMAGE_FMT)

# session first fields (packet 1)
SESSION_FIELDS_FMT  = "<BBbBHBb"
SESSION_FIELDS_SIZE = struct.calcsize(SESSION_FIELDS_FMT)

# lookup tables
TRACK_NAMES = {
    0: "Melbourne",       1: "Paul Ricard",        2: "Shanghai",
    3: "Bahrain",         4: "Catalunya",           5: "Monaco",
    6: "Montreal",        7: "Silverstone",         8: "Hockenheim",
    9: "Hungaroring",    10: "Spa",                11: "Monza",
   12: "Singapore",      13: "Suzuka",             14: "Abu Dhabi",
   15: "Texas (COTA)",   16: "Brazil",             17: "Austria",
   18: "Sochi",          19: "Mexico City",        20: "Baku",
   21: "Bahrain Short",  22: "Silverstone Short",  23: "Texas Short",
   24: "Suzuka Short",   25: "Hanoi",              26: "Zandvoort",
   27: "Imola",          28: "Portimão",           29: "Jeddah",
   30: "Miami",          31: "Las Vegas",          32: "Losail",
}

TYRE_COMPOUNDS = {
    16: "Soft",   17: "Medium", 18: "Hard",
     7: "Inter",   8: "Wet",
     9: "Dry C1", 10: "Dry C2", 11: "Dry C3", 12: "Dry C4", 13: "Dry C5",
}

WEATHER_LABELS = {
    0: "Clear", 1: "Light Cloud", 2: "Overcast",
    3: "Light Rain", 4: "Heavy Rain", 5: "Storm",
}

ERS_MODES = {0: "None", 1: "Medium", 2: "Hotlap", 3: "Overtake"}

SESSION_TYPES = {
     0: "Unknown",      1: "Practice 1",       2: "Practice 2",
     3: "Practice 3",   4: "Short Practice",   5: "Qualifying 1",
     6: "Qualifying 2", 7: "Qualifying 3",     8: "Short Qualifying",
     9: "One-Shot Quali",10: "Race",           11: "Race 2",
    12: "Race 3",       13: "Time Trial",
}