# backend/providers/http_headers.py
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup  # pip install beautifulsoup4
import re

SECURITY_HEADERS = [
    "strict-transport-security",
    "content-security-policy",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
]

WAF_INDICATORS = [
    "cloudflare", "cloudfront", "akamai", "sucuri", "mod_security", "imperva",
    "fastly", "incapsula", "f5", "barracuda", "netscaler", "cdn",
]

def _normalize_url(url: str) -> str:
    if not url.startswith(("http://", "https://")):
        return "http://" + url
    return url

def _fetch(session: requests.Session, url: str, method: str = "HEAD", timeout: int = 7):
    if method.upper() == "GET":
        r = session.get(url, timeout=timeout, allow_redirects=False)
    else:
        r = session.head(url, timeout=timeout, allow_redirects=False)
    return r

def _redirect_chain(session: requests.Session, url: str, method: str):
    chain = []
    current = url
    # follow up to 8 redirects manually to capture the whole chain
    for _ in range(8):
        r = _fetch(session, current, method=method)
        chain.append({"url": current, "status": r.status_code, "location": r.headers.get("Location")})
        if r.is_redirect or r.is_permanent_redirect:
            loc = r.headers.get("Location")
            if not loc:
                break
            if loc.startswith("//"):  # scheme-relative
                loc = ("https:" if current.startswith("https") else "http:") + loc
            elif loc.startswith("/"):
                base = "/".join(current.split("/")[:3])
                loc = urljoin(base, loc)
            current = loc
            continue
        break
    final = chain[-1]["url"]
    final_status = chain[-1]["status"]
    final_headers = _fetch(session, final, method="HEAD").headers  # safe HEAD at the end
    return chain, final, final_status, final_headers

def _get_title_and_meta(html_text: str):
    try:
        soup = BeautifulSoup(html_text, "html.parser")
        title = soup.title.string.strip() if soup.title and soup.title.string else None
        desc = None
        dm = soup.find("meta", attrs={"name": re.compile("^description$", re.I)})
        if dm and dm.get("content"):
            desc = dm["content"].strip()
        return title, desc
    except Exception:
        return None, None

def _detect_waf_from_headers(headers: dict):
    server = (headers.get("server") or "") + " " + " ".join(k for k in headers.keys())
    joined = server.lower()
    for w in WAF_INDICATORS:
        if w in joined:
            return True, w
    return False, None

def _security_checks(headers: dict):
    checks = {}
    score = 0
    max_score = len(SECURITY_HEADERS)
    for h in SECURITY_HEADERS:
        present = any(k.lower() == h for k in headers.keys())
        checks[h] = {"present": present, "value": headers.get(h) if present else None}
        if present:
            score += 1
    pct = int((score / max_score) * 100) if max_score else 0
    # map to A–F
    grade = "F"
    if pct >= 90: grade = "A"
    elif pct >= 75: grade = "B"
    elif pct >= 60: grade = "C"
    elif pct >= 45: grade = "D"
    elif pct >= 30: grade = "E"
    return checks, pct, grade

def _cookie_audit(headers: dict):
    out = []
    for k, v in headers.items():
        if k.lower() == "set-cookie":
            # can be multiple Set-Cookie headers; requests may fold them, split on comma only if it separates cookies.
            # we take a safe approach: split by '\n' if available; otherwise treat as single cookie.
            cookies = [v] if "\n" not in v else v.split("\n")
            for c in cookies:
                s = c.lower()
                out.append({
                    "raw": c,
                    "secure": "secure" in s,
                    "httponly": "httponly" in s,
                    "samesite": ("samesite=" in s),
                    "cross_site_risk": ("samesite=lax" not in s and "samesite=strict" not in s)
                })
    return out

def _http_version_hint(headers: dict):
    # We can’t reliably read HTTP version from requests alone.
    # Infer HTTP/3 support from alt-svc, HTTP/2 from 'h2' or via ALPN (handled in ports module).
    altsvc = headers.get("alt-svc", "") or ""
    h3 = "h3" in altsvc
    h2_hint = "h2" in altsvc
    return {"http2_hint": h2_hint, "http3_hint": h3}

def fetch_headers(url: str, method: str = "HEAD", fetch_html: bool = False, robots: bool = False, sitemap: bool = False,
                  redirect_chain: bool = True, cookie_inspect: bool = True, csp_analyze: bool = True):
    """
    Returns (headers: dict, status_code: int, final_url: str, extras: dict)
    extras includes: title, meta_description, robots_txt, sitemap_xml,
    security_checks, security_score, security_grade, waf_detected, waf_name,
    cookies (audit), csp_issues, redirect_chain, http_version_hints
    """
    url = _normalize_url(url)
    extras = {
        "title": None,
        "meta_description": None,
        "robots": None,
        "sitemap": None,
        "security_checks": None,
        "security_score": None,
        "security_grade": None,
        "waf_detected": False,
        "waf_name": None,
        "cookies": [],
        "csp_issues": [],
        "redirect_chain": [],
        "http_version_hints": {}
    }

    s = requests.Session()
    s.max_redirects = 10

    # Build redirect chain & final response headers
    if redirect_chain:
        chain, final_url, final_status, final_headers = _redirect_chain(s, url, method)
        extras["redirect_chain"] = chain
        headers = {k: v for k, v in final_headers.items()}
        status = final_status
    else:
        r = _fetch(s, url, method=method)
        headers = {k: v for k, v in r.headers.items()}
        status = r.status_code
        final_url = r.url

    # waf + security headers
    waf, name = _detect_waf_from_headers(headers)
    extras["waf_detected"] = bool(waf)
    extras["waf_name"] = name
    checks, score, grade = _security_checks(headers)
    extras["security_checks"] = checks
    extras["security_score"] = score
    extras["security_grade"] = grade

    # HTML title/meta
    if fetch_html:
        try:
            rh = s.get(final_url, timeout=8, allow_redirects=True)
            title, desc = _get_title_and_meta(rh.text)
            extras["title"] = title
            extras["meta_description"] = desc
        except requests.TooManyRedirects:
            extras["title"] = None
            extras["meta_description"] = None
        except Exception:
            pass

        # robots/sitemap
    base = "/".join(final_url.split("/")[:3])
    if robots:
        try:
            rr = s.get(urljoin(base, "/robots.txt"), timeout=6, allow_redirects=True)
            extras["robots"] = rr.text if rr.status_code == 200 else None
        except requests.TooManyRedirects:
            extras["robots"] = None
        except Exception:
            pass
    if sitemap:
        try:
            sm = s.get(urljoin(base, "/sitemap.xml"), timeout=8, allow_redirects=True)
            extras["sitemap"] = sm.text if sm.status_code == 200 else None
        except requests.TooManyRedirects:
            extras["sitemap"] = None
        except Exception:
            pass

    # cookie inspection
    if cookie_inspect:
        extras["cookies"] = _cookie_audit(headers)

    # CSP analyzer (very lightweight)
    if csp_analyze:
        csp = headers.get("content-security-policy")
        issues = []
        if csp:
            low = csp.lower()
            if "'unsafe-inline'" in low or "unsafe-inline" in low:
                issues.append("CSP allows 'unsafe-inline' (XSS risk).")
            if "*" in low:
                issues.append("CSP uses wildcard sources (*).")
        extras["csp_issues"] = issues

    # HTTP version hints
    extras["http_version_hints"] = _http_version_hint(headers)

    return headers, status, final_url, extras
