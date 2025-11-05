import dns.resolver
import dns.exception

def resolve_one(domain: str, rtype: str):
    try:
        answers = dns.resolver.resolve(domain, rtype, lifetime=2.0)
        out = []
        for r in answers:
            out.append(r.to_text())
        return out
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.exception.Timeout, dns.resolver.NoNameservers):
        return []
    except Exception:
        return []

def resolve_records(domain: str, types: list[str]):
    res = {}
    for t in types:
        res[t] = resolve_one(domain, t)
    return res

def dns_health(domain: str):
    has_a = bool(resolve_one(domain, "A"))
    has_ns = bool(resolve_one(domain, "NS"))
    has_mx = bool(resolve_one(domain, "MX"))
    return {
        "has_A": has_a,
        "has_NS": has_ns,
        "has_MX": has_mx,
        "ok": has_a or has_ns,
    }
