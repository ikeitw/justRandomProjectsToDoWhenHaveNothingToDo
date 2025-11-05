from pathlib import Path

def read_pe_info(path: Path) -> dict | None:
    try:
        with path.open("rb") as f:
            mz = f.read(2)
            if mz != b"MZ":
                return None
    except Exception:
        return None

    try:
        import pefile
    except Exception:
        return {"note": "PE magic detected (MZ) but python 'pefile' not installed."}

    try:
        pe = pefile.PE(str(path), fast_load=True)
        pe.parse_data_directories(directories=[
            pefile.DIRECTORY_ENTRY["IMAGE_DIRECTORY_ENTRY_IMPORT"],
            pefile.DIRECTORY_ENTRY["IMAGE_DIRECTORY_ENTRY_EXPORT"],
        ])

        sections = []
        for s in pe.sections:
            name = s.Name.rstrip(b"\x00").decode("ascii", "ignore")
            sec = {
                "name": name,
                "vaddr": hex(s.VirtualAddress),
                "vsize": s.Misc_VirtualSize,
                "raw_size": s.SizeOfRawData,
                "entropy": round(s.get_entropy(), 4),
                "characteristics": hex(s.Characteristics),
                "wx": bool(s.IMAGE_SCN_MEM_WRITE and s.IMAGE_SCN_MEM_EXECUTE),
            }
            sections.append(sec)

        imports = []
        if hasattr(pe, "DIRECTORY_ENTRY_IMPORT"):
            for entry in pe.DIRECTORY_ENTRY_IMPORT:
                dll = entry.dll.decode(errors="ignore") if entry.dll else ""
                funcs = [imp.name.decode(errors="ignore") if imp.name else f"ord_{imp.ordinal}" for imp in entry.imports]
                imports.append({"dll": dll, "functions": funcs[:50]})

        exports = []
        if hasattr(pe, "DIRECTORY_ENTRY_EXPORT") and pe.DIRECTORY_ENTRY_EXPORT:
            names = [e.name.decode(errors="ignore") for e in pe.DIRECTORY_ENTRY_EXPORT.symbols if e.name]
            exports = names[:200]

        return {
            "machine": hex(pe.FILE_HEADER.Machine),
            "timestamp": pe.FILE_HEADER.TimeDateStamp,
            "entry_point": hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint),
            "image_base": hex(pe.OPTIONAL_HEADER.ImageBase),
            "subsystem": pe.OPTIONAL_HEADER.Subsystem,
            "sections": sections,
            "imports": imports[:40],
            "exports": exports,
        }
    except Exception as e:
        return {"error": f"pe parse error: {e}"}
