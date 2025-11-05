from pathlib import Path

def _format_hex_lines(data: bytes, base_offset: int) -> list[str]:
    lines = []
    for i in range(0, len(data), 16):
        chunk = data[i:i+16]
        hexpart = " ".join(f"{b:02X}" for b in chunk)
        if len(chunk) < 16:
            hexpart += "   " * (16 - len(chunk))
        ascii_part = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)
        lines.append(f"{base_offset + i:08X}  {hexpart[:8*3-1]}  {hexpart[8*3:]}  |{ascii_part}|")
    return lines

def read_hex_chunk(path: Path, offset: int, length: int):
    size = path.stat().st_size
    if offset > size:
        return {"offset": offset, "length": 0, "size": size, "lines": []}
    with path.open("rb") as f:
        f.seek(offset)
        data = f.read(length)
    return {
        "offset": offset,
        "length": len(data),
        "size": size,
        "lines": _format_hex_lines(data, offset),
    }
