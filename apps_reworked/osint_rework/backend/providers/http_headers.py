import requests

def fetch_headers(url: str, method: str = "HEAD"):
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "http://" + url
    s = requests.Session()
    s.max_redirects = 5
    try:
        if method.upper() == "GET":
            r = s.get(url, timeout=5, allow_redirects=True)
        else:
            r = s.head(url, timeout=5, allow_redirects=True)
        headers = {k: v for k, v in r.headers.items()}
        return headers, r.status_code, r.url
    except Exception as e:
        raise e
