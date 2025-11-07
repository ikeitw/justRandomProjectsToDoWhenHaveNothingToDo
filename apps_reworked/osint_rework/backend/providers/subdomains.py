import socket
import requests
import urllib.parse
import random
import string

DEFAULT_WORDS = [
    "www","api","dev","test","stage","staging","mail","smtp","imap","pop","vpn",
    "cdn","static","blog","shop","admin","portal","intranet","files","assets",
    "git","jira","status","monitor","grafana","kibana","elastic","db","mysql",
    "postgres","mssql","redis","cache","backup","beta","alpha","qa","demo",
]

CRTSH_URL = "https://crt.sh/?q={q}&output=json"

def _rand_label(n=10):
    return "".join(random.choice(string.ascii_lowercase) for _ in range(n))

def wildcard_present(domain: str) -> bool:
    bogus = f"{_rand_label()}.{domain}"
    try:
        socket.gethostbyname(bogus)
        return True
    except Exception:
        return False

def brute_subdomains(domain: str, max_results: int = 100, words: list | None = None, want_ipv6: bool = True):
    found = []
    words = words or DEFAULT_WORDS
    for w in words:
        if len(found) >= max_results:
            break
        sub = f"{w}.{domain}"
        ip4 = None
        ip6 = None
        try:
            ip4 = socket.gethostbyname(sub)
        except Exception:
            pass
        if want_ipv6:
            try:
                ip6 = socket.getaddrinfo(sub, None, socket.AF_INET6)[0][4][0]
            except Exception:
                pass
        if ip4 or ip6:
            found.append({"subdomain": sub, "ip4": ip4, "ip6": ip6, "source": "brute"})
    return found

def query_crtsh(domain: str, max_results: int = 200, want_ipv6: bool = True):
    try:
        q = urllib.parse.quote(f"%.{domain}")
        url = CRTSH_URL.format(q=q)
        r = requests.get(url, timeout=7)
        if r.status_code != 200:
            return []
        data = r.json()
        subs = set()
        out = []
        for item in data:
            name = item.get("name_value") or item.get("common_name")
            if not name:
                continue
            for part in (name.splitlines() if "\n" in name else [name]):
                part = part.strip()
                if part.endswith(domain):
                    if part not in subs:
                        subs.add(part)
                        ip4 = None
                        ip6 = None
                        try:
                            ip4 = socket.gethostbyname(part)
                        except Exception:
                            pass
                        if want_ipv6:
                            try:
                                ip6 = socket.getaddrinfo(part, None, socket.AF_INET6)[0][4][0]
                            except Exception:
                                pass
                        out.append({"subdomain": part, "ip4": ip4, "ip6": ip6, "source": "crtsh"})
                        if len(out) >= max_results:
                            return out
        return out
    except Exception:
        return []

def http_liveness(sub: str, timeout: int = 4):
    try:
        r = requests.head("http://" + sub, timeout=timeout, allow_redirects=True)
        if r.status_code:
            return {"http": True, "https": False, "status_http": r.status_code, "status_https": None}
    except Exception:
        pass
    try:
        r = requests.head("https://" + sub, timeout=timeout, allow_redirects=True)
        if r.status_code:
            return {"http": False, "https": True, "status_http": None, "status_https": r.status_code}
    except Exception:
        pass
    return {"http": False, "https": False, "status_http": None, "status_https": None}

def discover(domain: str, max_results: int = 200, use_crtsh: bool = True, want_ipv6: bool = True,
             check_liveness: bool = False, detect_wildcard: bool = True):
    wcard = wildcard_present(domain) if detect_wildcard else False
    out = []
    if use_crtsh:
        out += query_crtsh(domain, max_results=max_results, want_ipv6=want_ipv6)
    if len(out) < max_results:
        remaining = max_results - len(out)
        out += brute_subdomains(domain, max_results=remaining, want_ipv6=want_ipv6)

    tmp = {}
    for e in out:
        key = e["subdomain"].lower()
        if key not in tmp:
            tmp[key] = e
    final = list(tmp.values())

    for e in final:
        e["wildcard_suspected"] = bool(wcard)
        if check_liveness:
            e["live"] = http_liveness(e["subdomain"])

    return final[:max_results]
