import dns.resolver
import dns.exception
import dns.query
import dns.zone
import socket
import requests

CLOUDFLARE_DOH = "https://cloudflare-dns.com/dns-query"

def resolve_one(domain: str, rtype: str, lifetime: float = 2.0, want_ttl: bool = False):
    try:
        ans = dns.resolver.resolve(domain, rtype, lifetime=lifetime, raise_on_no_answer=False)
        if not ans.rrset:
            return [] if not want_ttl else []
        if want_ttl:
            ttl = ans.rrset.ttl
            return [{"value": r.to_text(), "ttl": ttl} for r in ans]
        else:
            return [r.to_text() for r in ans]
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.resolver.NoNameservers, dns.exception.Timeout):
        return [] if not want_ttl else []
    except Exception:
        return [] if not want_ttl else []

def resolve_one_doh(domain: str, rtype: str, want_ttl: bool = False, timeout: int = 3):
    try:
        params = {"name": domain, "type": rtype}
        headers = {"accept": "application/dns-json"}
        r = requests.get(CLOUDFLARE_DOH, params=params, headers=headers, timeout=timeout)
        if r.status_code != 200:
            return [] if not want_ttl else []
        data = r.json()
        answers = data.get("Answer") or []
        out = []
        for a in answers:
            if a.get("type") and a.get("data"):
                if want_ttl:
                    out.append({"value": a["data"], "ttl": a.get("TTL")})
                else:
                    out.append(a["data"])
        return out
    except Exception:
        return [] if not want_ttl else []

def resolve_records(domain: str, types: list[str], want_ttl: bool = False, use_doh: bool = False):
    res = {}
    for t in types:
        r = resolve_one(domain, t, want_ttl=want_ttl)
        if not r and use_doh:
            r = resolve_one_doh(domain, t, want_ttl=want_ttl)
        res[t] = r
    return res

def dns_health(domain: str, use_doh: bool = False):
    has_a = bool(resolve_one(domain, "A") or (use_doh and resolve_one_doh(domain, "A")))
    has_ns = bool(resolve_one(domain, "NS") or (use_doh and resolve_one_doh(domain, "NS")))
    has_mx = bool(resolve_one(domain, "MX") or (use_doh and resolve_one_doh(domain, "MX")))
    return {
        "has_A": has_a,
        "has_NS": has_ns,
        "has_MX": has_mx,
        "ok": has_a or has_ns,
    }

def get_spf(domain: str, use_doh: bool = False):
    txts = resolve_one(domain, "TXT") or (use_doh and resolve_one_doh(domain, "TXT")) or []
    vals = [t["value"] if isinstance(t, dict) else t for t in txts]
    for t in vals:
        low = t.lower()
        if low.startswith("v=spf1"):
            return t
    return None

def get_dmarc(domain: str, use_doh: bool = False):
    d = f"_dmarc.{domain}"
    txts = resolve_one(d, "TXT") or (use_doh and resolve_one_doh(d, "TXT")) or []
    vals = [t["value"] if isinstance(t, dict) else t for t in txts]
    for t in vals:
        if t.lower().startswith("v=dmarc1"):
            return t
    return None

def get_caa(domain: str, use_doh: bool = False):
    caa = resolve_one(domain, "CAA") or (use_doh and resolve_one_doh(domain, "CAA")) or []
    return caa

def attempt_axfr(ns: str, domain: str, timeout: int = 5):
    try:
        target = socket.gethostbyname(ns.split()[-1]) if " " in ns else socket.gethostbyname(ns)
    except Exception:
        target = ns
    try:
        xfr = dns.query.xfr(target, domain, timeout=timeout)
        zone = dns.zone.from_xfr(xfr)
        if not zone:
            return None
        records = []
        for name, node in zone.nodes.items():
            for rdataset in node.rdatasets:
                for rdata in rdataset:
                    fqdn = f"{name.to_text()}.{domain}".strip(".")
                    records.append(f"{fqdn} {rdataset.rdtype} {rdata.to_text()}")
        return records
    except Exception:
        return None

def ptr_for_addresses(records: list):
    addrs = []
    for r in records:
        v = r["value"] if isinstance(r, dict) else r
        addrs.append(v)
    out = {}
    for ip in addrs:
        try:
            host, _, _ = socket.gethostbyaddr(ip)
            out[ip] = host
        except Exception:
            out[ip] = None
    return out
