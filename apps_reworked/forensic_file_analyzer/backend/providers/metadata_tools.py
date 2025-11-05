from pathlib import Path
import time
import mimetypes

def _try_magic(path: Path):
    try:
        import magic
        return magic.from_file(str(path)), magic.from_file(str(path), mime=True)
    except Exception:
        return None, None

def read_basic_metadata(path: Path) -> dict:
    st = path.stat()
    mime_guess, mime_type = _try_magic(path)
    fallback = mimetypes.guess_type(str(path))[0]
    return {
        "size": st.st_size,
        "created": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(st.st_ctime)),
        "modified": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(st.st_mtime)),
        "accessed": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(st.st_atime)),
        "mime_detected": mime_type or fallback,
        "type_desc": mime_guess or "",
        "extension": path.suffix.lower(),
        "is_executable_hint": path.suffix.lower() in {".exe", ".dll", ".scr", ".sys"},
    }
