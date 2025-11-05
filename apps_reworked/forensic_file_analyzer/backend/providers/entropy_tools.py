from math import log2
from pathlib import Path

def shannon_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    freq = [0]*256
    for b in data:
        freq[b] += 1
    ent = 0.0
    n = len(data)
    for c in freq:
        if c:
            p = c / n
            ent -= p * log2(p)
    return ent

def calc_entropy(path: Path, window: int = 16384) -> dict:
    total_len = path.stat().st_size
    sample = []
    overall_hash = 0.0
    read = 0
    with path.open("rb") as f:
        chunks = 0
        while True:
            buf = f.read(window)
            if not buf:
                break
            e = shannon_entropy(buf)
            sample.append({"offset": read, "length": len(buf), "entropy": round(e, 4)})
            overall_hash += e * len(buf)
            read += len(buf)
            chunks += 1
    overall = round(overall_hash / total_len, 4) if total_len else 0.0
    if len(sample) > 256:
        step = len(sample) // 256
        sample = sample[::step][:256]
    return {"overall": overall, "windows": sample, "max": 8.0}
