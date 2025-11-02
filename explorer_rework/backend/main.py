from __future__ import annotations

import platform
import shutil
import string
from pathlib import Path
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Drill-Down Explorer API")

# CORS (harmless in desktop shell)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"]
)

# ---------- Helpers ----------
def list_disks() -> List[Dict[str, str]]:
    """
    Windows: C:\\, D:\\ ...
    POSIX: / and common mount points.
    """
    sysname = platform.system().lower()
    if "windows" in sysname:
        disks: List[Dict[str, str]] = []
        for letter in string.ascii_uppercase:
            root = Path(f"{letter}:\\")
            if root.exists():
                p = str(root.absolute())
                if not p.endswith("\\"):
                    p += "\\"
                disks.append({"name": f"{letter}:", "path": p})
        return disks

    # POSIX
    candidates = {"/"}
    for base in ("/mnt", "/media", "/Volumes", "/run/media"):
        b = Path(base)
        if b.exists():
            if b.is_mount():
                candidates.add(str(b))
            try:
                for e in b.iterdir():
                    if e.is_dir() and e.is_mount():
                        candidates.add(str(e))
            except PermissionError:
                pass
    return [{"name": "Root (/)" if p == "/" else p, "path": p} for p in sorted(candidates)]


def list_dir_immediate(base: Path, max_children: int = 500) -> Dict[str, Any]:
    """
    Return the immediate children of `base` WITHOUT following junctions/symlinks.
    Graph:
      nodes: [base, child...], links: [base->child], parent
    """
    if not base.exists():
        raise HTTPException(status_code=404, detail="Path does not exist")
    if not base.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory")

    base_abs_str = str(base.absolute())
    base_path = Path(base_abs_str)

    nodes: List[Dict[str, Any]] = []
    links: List[Dict[str, str]] = []
    seen_ids: set[str] = set()

    def add_node(p: Path, t: str, size: int = 0):
        pid = str(p)
        if pid in seen_ids:
            return
        nodes.append({
            "id": pid,
            "name": (p.name or pid),
            "type": t,
            "size": size,
            "ext": (p.suffix.lower()[1:] if p.suffix else "")
        })
        seen_ids.add(pid)

    add_node(base_path, "dir")

    count = 0
    try:
        for entry in base_path.iterdir():
            if count >= max_children:
                break
            try:
                entry_abs = entry.absolute()
                entry_abs_str = str(entry_abs)

                # Skip self-loops (junction pointing back to base)
                if entry_abs_str == base_abs_str:
                    continue

                if entry.is_dir():
                    add_node(entry_abs, "dir")
                else:
                    try:
                        sz = entry.stat().st_size
                    except Exception:
                        sz = 0
                    add_node(entry_abs, "file", size=sz)

                links.append({"source": base_abs_str, "target": entry_abs_str})
                count += 1
            except PermissionError:
                continue
    except PermissionError:
        pass

    # parent (None for drive root)
    parent: Optional[str] = None
    if base_path.parent != base_path:
        parent = str(base_path.parent.absolute())

    return {"base": base_abs_str, "parent": parent, "nodes": nodes, "links": links}


def human_bytes(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB", "PB"):
        if n < 1024:
            return f"{n:.0f} {unit}"
        n /= 1024
    return f"{n:.0f} EB"

# ---------- API ----------
@app.get("/drives")
def drives():
    return list_disks()

@app.get("/dir")
def dir_graph(base: str = Query(..., description="Absolute directory (immediate children only)")):
    return list_dir_immediate(Path(base).absolute())

@app.get("/disk_usage")
def disk_usage(path: str = Query(..., description="Any path on the target volume")):
    """
    Return total/used/free bytes for the volume containing 'path'.
    """
    p = Path(path).absolute()
    if not p.exists():
        raise HTTPException(status_code=404, detail="Path does not exist")
    try:
        total, used, free = shutil.disk_usage(str(p))
        return {
            "path": str(p),
            "total": total,
            "used": used,
            "free": free,
            "total_human": human_bytes(total),
            "used_human": human_bytes(used),
            "free_human": human_bytes(free),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/read")
def read_file(path: str):
    p = Path(path).absolute()
    if not p.exists() or not p.is_file():
        return PlainTextResponse("Not a file.")
    try:
        text = p.read_text(errors="ignore")
        return PlainTextResponse(text[:20000])
    except Exception:
        return PlainTextResponse("[Binary or unreadable file]")


# ---------- Static & Index ----------
_here = Path(__file__).parent
_frontend_dir = (_here.parent / "frontend").absolute()

if _frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(_frontend_dir)), name="static")

@app.get("/")
def index() -> HTMLResponse:
    index_html = _frontend_dir / "index.html"
    if index_html.exists():
        return HTMLResponse(index_html.read_text(encoding="utf-8", errors="ignore"))
    return HTMLResponse("<h1>Explorer</h1><p>Put the frontend at ../frontend/index.html</p>")
