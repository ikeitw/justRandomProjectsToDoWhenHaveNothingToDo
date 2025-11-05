from pathlib import Path
import re

_ASCII_RE = re.compile(rb"[ -~]{4,}")

def extract_ascii_strings(path: Path, min_len: int = 4, max_results: int = 5000):
    cnt = 0
    items = []
    with path.open("rb") as f:
        data = f.read()
        for m in _ASCII_RE.finditer(data):
            s = m.group()
            if len(s) >= min_len:
                items.append({"offset": m.start(), "s": s.decode("ascii", "ignore")})
                cnt += 1
                if len(items) >= max_results:
                    break
    return {"count": cnt, "items": items}

def extract_utf16le_strings(path: Path, min_len: int = 4, max_results: int = 5000):
    cnt = 0
    items = []
    with path.open("rb") as f:
        data = f.read()
    out = []
    i = 0
    start = None
    while i + 1 < len(data):
        lo = data[i]
        hi = data[i+1]
        if hi == 0 and 32 <= lo < 127:
            if start is None:
                start = i
            out.append(lo)
        else:
            if start is not None:
                if len(out) >= min_len:
                    s = bytes(out).decode("ascii", "ignore")
                    items.append({"offset": start, "s": s})
                    cnt += 1
                    if len(items) >= max_results:
                        break
                out = []
                start = None
        i += 2
    if start is not None and len(out) >= min_len and len(items) < max_results:
        s = bytes(out).decode("ascii", "ignore")
        items.append({"offset": start, "s": s})
        cnt += 1
    return {"count": cnt, "items": items}
