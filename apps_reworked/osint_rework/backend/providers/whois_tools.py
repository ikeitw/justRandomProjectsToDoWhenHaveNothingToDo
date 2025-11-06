# backend/providers/whois_tools.py
def whois_domain(domain: str):
    try:
        import whois
        data = whois.whois(domain)
        def _fmt(dt):
            try:
                return str(dt)
            except Exception:
                return None
        return {
            "domain_name": str(data.domain_name) if data.domain_name else None,
            "registrar": data.registrar,
            "creation_date": _fmt(data.creation_date) if data.creation_date else None,
            "expiration_date": _fmt(data.expiration_date) if data.expiration_date else None,
            "name_servers": list(data.name_servers) if data.name_servers else [],
            "status": data.status if isinstance(data.status, list) else [data.status] if data.status else [],
        }
    except Exception:
        return None

def whois_ip(ip: str):
    try:
        from ipwhois import IPWhois
        w = IPWhois(ip)
        res = w.lookup_rdap(depth=1)
        return {
            "asn": res.get("asn"),
            "asn_description": res.get("asn_description"),
            "network_name": res.get("network", {}).get("name"),
            "network_cidr": res.get("network", {}).get("cidr"),
            "country": res.get("asn_country_code"),
            "entities_count": len(res.get("objects", {}) or {}),
        }
    except Exception:
        return None
