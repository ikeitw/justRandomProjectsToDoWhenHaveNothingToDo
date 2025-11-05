from pathlib import Path

SUS_STRING_PATTERNS = [
    "powershell", "cmd.exe", "wscript", "cscript", "regsvr32",
    "bitsadmin", "certutil", "schtasks", "rundll32", "mimikatz",
    "http://", "https://", "ftp://", "pastebin", "discordapp",
    "base64", "FromBase64String", "Invoke-WebRequest", "curl",
]
SUS_IMPORTS = [
    "WinExec", "CreateRemoteThread", "VirtualAlloc", "WriteProcessMemory",
    "InternetOpen", "URLDownloadToFile", "WSASocket", "connect",
    "CryptDecrypt", "CryptImportKey", "RegSetValue", "AddScheduledTask",
]

def analyze_iocs(path: Path, meta: dict, entropy: dict, pe: dict|None,
                 ascii_strings: dict, uni_strings: dict) -> dict:
    flags = []

    if entropy and entropy.get("overall", 0) >= 7.2:
        flags.append({"severity":"high","id":"high_entropy","msg":"Overall entropy is high (>= 7.2) — possible packing/obfuscation."})

    if meta.get("is_executable_hint") and not (meta.get("mime_detected") or "").startswith(("application/x-dosexec","application/vnd.microsoft.portable-executable","application/octet-stream")):
        flags.append({"severity":"medium","id":"exe_extension","msg":"File has executable extension."})

    found_strings = []
    all_strings = [s["s"].lower() for s in ascii_strings.get("items", []) + uni_strings.get("items", [])]
    for pat in SUS_STRING_PATTERNS:
        if any(pat in s for s in all_strings):
            found_strings.append(pat)
    if found_strings:
        flags.append({"severity":"medium","id":"sus_strings","msg":"Suspicious strings present: " + ", ".join(sorted(set(found_strings)))[:200]})

    if pe and isinstance(pe, dict) and not pe.get("error"):
        for s in pe.get("sections", []):
            if s.get("wx") or s.get("entropy", 0) >= 7.2:
                flags.append({"severity":"high","id":"wx_section","msg":f"Section '{s.get('name')}' writable+executable or high entropy."})
                break

        imported = []
        for imp in pe.get("imports", []):
            for f in imp.get("functions", []):
                if f and any(x.lower() == f.lower() for x in SUS_IMPORTS):
                    imported.append(f)
        if imported:
            flags.append({"severity":"medium","id":"sus_imports","msg":"Suspicious API imports: " + ", ".join(sorted(set(imported)))[:200]})

    severity = "ok"
    if any(f["severity"]=="high" for f in flags):
        severity = "high"
    elif any(f["severity"]=="medium" for f in flags):
        severity = "medium"

    return {"severity": severity, "flags": flags}
