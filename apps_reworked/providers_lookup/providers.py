#!/usr/bin/env python3
"""
Get the 5 upstream providers for the public IP space behind a domain.

Works on Windows 11:
  py providers.py howest.be

Method:
1) Resolve domain -> IPv4
2) RIPE Stat -> origin ASN
3) bgp.he.net -> scrape "Upstreams" provider names
4) Print providers alphabetically + top 5
"""

from __future__ import annotations
import sys
import socket
from typing import List, Optional
import requests
from bs4 import BeautifulSoup

UA = {"User-Agent": "providers-lookup/1.1"}
RIPE_STAT_PREFIX_OVERVIEW = "https://stat.ripe.net/data/prefix-overview/data.json"


def resolve_ipv4(domain: str) -> str:
    infos = socket.getaddrinfo(domain, 443, family=socket.AF_INET, type=socket.SOCK_STREAM)
    if not infos:
        raise RuntimeError(f"No IPv4 found for {domain}")
    return infos[0][4][0]


def origin_asn_ripe(ip: str, timeout: float = 10.0) -> int:
    r = requests.get(
        RIPE_STAT_PREFIX_OVERVIEW,
        params={"resource": ip},
        headers=UA,
        timeout=timeout,
    )
    r.raise_for_status()
    data = r.json().get("data", {})
    asns = data.get("asns") or []
    if not asns or "asn" not in asns[0]:
        raise RuntimeError(f"Could not extract origin ASN for {ip} from RIPE Stat.")
    return int(asns[0]["asn"])


def scrape_bgphe_upstreams(asn: int, timeout: float = 10.0) -> List[str]:
    """
    Scrape upstream provider names from https://bgp.he.net/AS<asn>
    """
    url = f"https://bgp.he.net/AS{asn}"
    r = requests.get(url, headers=UA, timeout=timeout)
    r.raise_for_status()

    soup = BeautifulSoup(r.text, "lxml")

    # The page has a section header like "Upstreams" followed by a table.
    # We'll find the element containing the text "Upstreams" then grab the next table rows.
    upstream_header = None
    for tag in soup.find_all(["h3", "h2", "div", "span"]):
        if tag.get_text(strip=True).lower() == "upstreams":
            upstream_header = tag
            break

    if upstream_header is None:
        # Sometimes it's inside a tab/anchor
        # Fall back: find any element with id/name containing upstream
        upstream_header = soup.find(id=lambda x: isinstance(x, str) and "upstream" in x.lower())

    if upstream_header is None:
        raise RuntimeError("Could not find 'Upstreams' section on bgp.he.net page.")

    # Find the next table after the header
    table = upstream_header.find_next("table")
    if table is None:
        raise RuntimeError("Found 'Upstreams' header but no table after it.")

    names: List[str] = []
    for row in table.find_all("tr"):
        cols = row.find_all("td")
        if len(cols) < 2:
            continue
        # column 1 is ASN, column 2 is Name
        name = cols[1].get_text(" ", strip=True)
        if name:
            names.append(name)

    # Deduplicate (case-insensitive) and sort
    seen = {}
    for n in names:
        key = n.lower()
        if key not in seen:
            seen[key] = n
    return sorted(seen.values(), key=lambda s: s.lower())


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: py providers.py <domain>")
        sys.exit(1)

    domain = sys.argv[1].strip()
    ip = resolve_ipv4(domain)
    asn = origin_asn_ripe(ip)

    upstreams = scrape_bgphe_upstreams(asn)

    print(f"Domain: {domain}")
    print(f"Resolved IPv4: {ip}")
    print(f"Origin ASN: AS{asn}\n")

    print("Upstream providers (alphabetical):")
    for u in upstreams:
        print(f"- {u}")

    print("\nTop 5 (alphabetical):")
    for u in upstreams[:5]:
        print(u)


if __name__ == "__main__":
    main()
