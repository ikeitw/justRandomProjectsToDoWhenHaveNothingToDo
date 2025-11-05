import socket

DEFAULT_WORDS = [
    "www","api","dev","test","stage","staging","mail","smtp","imap","pop","vpn",
    "cdn","static","blog","shop","admin","portal","intranet","files","assets",
    "git","jira","status","monitor","grafana","kibana","elastic","db","mysql",
    "postgres","mssql","redis","cache","backup","beta","alpha","qa","demo",
]

def brute_subdomains(domain: str, max_results: int = 100):
    found = []
    for w in DEFAULT_WORDS:
        if len(found) >= max_results:
            break
        sub = f"{w}.{domain}"
        try:
            ip = socket.gethostbyname(sub)
            found.append({"subdomain": sub, "ip": ip})
        except Exception:
            continue
    return found
