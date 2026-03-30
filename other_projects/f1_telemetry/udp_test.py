"""
udp_test.py — Quick UDP packet sniffer
Run to confirm F1 25 is sending data and packets are parsed correctly.
python udp_test.py
"""
import socket
import struct

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind(("0.0.0.0", 20777))
print("Listening for F1 25 packets on port 20777...")
print("Start a session in F1 25. Press Ctrl+C to stop.\n")

PACKET_NAMES = {
    0:"Motion", 1:"Session", 2:"LapData", 3:"Event",
    4:"Participants", 5:"CarSetups", 6:"CarTelemetry", 7:"CarStatus",
    8:"FinalClass", 9:"LobbyInfo", 10:"CarDamage", 11:"SessionHistory",
    12:"TyreSets", 13:"MotionEx", 14:"TimeTrial", 15:"LapPositions",
}

count = 0
while True:
    data, addr = sock.recvfrom(4096)
    count += 1

    if len(data) >= 29:
        fmt = "<HBBBBBQfIIBB"
        v = struct.unpack_from(fmt, data, 0)
        packet_format  = v[0]
        packet_id      = v[5]   # CORRECT: index 5
        player_idx     = v[10]  # CORRECT: index 10
        name = PACKET_NAMES.get(packet_id, f"Unknown({packet_id})")
        print(f"[#{count:04d}] {name:<16} playerIdx={player_idx}  size={len(data):>5} bytes  format={packet_format}")
    else:
        print(f"[#{count:04d}] too short: {len(data)} bytes")