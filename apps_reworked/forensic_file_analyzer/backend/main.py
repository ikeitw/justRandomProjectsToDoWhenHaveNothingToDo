import hashlib
import tempfile
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from .providers.metadata_tools import read_basic_metadata
from .providers.entropy_tools import calc_entropy
from .providers.hex_tools import read_hex_chunk
from .providers.strings_tools import extract_ascii_strings, extract_utf16le_strings
from .providers.pe_tools import read_pe_info
from .providers.ioc_rules import analyze_iocs

app = FastAPI(title="Forensic File Analyzer (Reworked)", version="1.0.0")

BASE_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIR = BASE_DIR / "frontend"
UPLOAD_DIR = Path(tempfile.gettempdir()) / "ffa_uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
def index():
    return FileResponse(FRONTEND_DIR / "index.html")

def _save_upload(u: UploadFile) -> Path:
    suffix = Path(u.filename or "upload.bin").suffix
    fpath = UPLOAD_DIR / (next(tempfile._get_candidate_names()) + suffix)  # noqa
    with fpath.open("wb") as f:
        for chunk in iter(lambda: u.file.read(1024 * 1024), b""):
            f.write(chunk)
    return fpath

def _hashes(path: Path) -> dict:
    md5 = hashlib.md5()
    sha1 = hashlib.sha1()
    sha256 = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            md5.update(chunk); sha1.update(chunk); sha256.update(chunk)
    return {
        "md5": md5.hexdigest(),
        "sha1": sha1.hexdigest(),
        "sha256": sha256.hexdigest(),
    }

@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="no filename")
    fp = _save_upload(file)
    return {"ok": True, "path": str(fp), "filename": file.filename, "size": fp.stat().st_size}

@app.get("/api/analyze")
def analyze(path: str = Query(..., description="absolute path returned by /api/upload")):
    p = Path(path)
    if not p.exists() or not p.is_file():
        raise HTTPException(status_code=404, detail="file not found")

    meta = read_basic_metadata(p)
    hashes = _hashes(p)
    entropy = calc_entropy(p)
    peinfo = read_pe_info(p)
    ascii_sample = extract_ascii_strings(p, min_len=4, max_results=200)
    uni_sample = extract_utf16le_strings(p, min_len=4, max_results=100)
    iocs = analyze_iocs(
        path=p,
        meta=meta,
        entropy=entropy,
        pe=peinfo,
        ascii_strings=ascii_sample,
        uni_strings=uni_sample,
    )

    return {
        "path": str(p),
        "filename": p.name,
        "size": p.stat().st_size,
        "hashes": hashes,
        "metadata": meta,
        "entropy": entropy,
        "pe": peinfo,
        "strings_sample": {
            "ascii_count": ascii_sample["count"],
            "unicode_count": uni_sample["count"],
            "ascii_preview": ascii_sample["items"],
            "unicode_preview": uni_sample["items"],
        },
        "iocs": iocs,
    }

@app.get("/api/hex")
def hex_chunk(path: str, offset: int = 0, length: int = 4096):
    p = Path(path)
    if not p.exists():
        raise HTTPException(status_code=404, detail="file not found")
    if offset < 0 or length <= 0:
        raise HTTPException(status_code=400, detail="invalid offset/length")
    data = read_hex_chunk(p, offset, length)
    return data

@app.get("/api/strings")
def strings(path: str, kind: str = "ascii", min_len: int = 4, max_results: int = 5000):
    p = Path(path)
    if not p.exists():
        raise HTTPException(status_code=404, detail="file not found")
    if kind == "ascii":
        res = extract_ascii_strings(p, min_len=min_len, max_results=max_results)
    elif kind in ("unicode", "utf16", "utf16le"):
        res = extract_utf16le_strings(p, min_len=min_len, max_results=max_results)
    else:
        raise HTTPException(status_code=400, detail="kind must be ascii or unicode")
    return res

@app.post("/api/export")
async def export_report(payload: dict):
    exports_dir = FRONTEND_DIR / "exports"
    exports_dir.mkdir(exist_ok=True)
    file_path = exports_dir / "ffa_report.json"
    with open(file_path, "w", encoding="utf-8") as f:
        import json
        json.dump(payload, f, ensure_ascii=False, indent=2)
    return {"ok": True, "download": "/static/exports/ffa_report.json"}
