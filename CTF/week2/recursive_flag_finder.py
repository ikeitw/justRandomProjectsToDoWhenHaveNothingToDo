from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import time
import re

BASE_URL = "http://192.168.16.109:9204"
START_PATHS = ["/warplane/1", "/warplane/122", "/warplane/243"]
visited = set()
flag_found = False

# Setup headless Chrome
options = Options()
options.add_argument('--headless')
options.add_argument('--disable-gpu')
driver = webdriver.Chrome(options=options)

def visit(path):
    global flag_found
    if flag_found or path in visited:
        return
    full_url = BASE_URL + path
    print(f"🌐 Visiting: {full_url}")
    visited.add(path)

    try:
        driver.get(full_url)
        time.sleep(0.5)
        source = driver.page_source

        # Case-insensitive flag search
        if re.search(r'flag', source, re.IGNORECASE):
            print("\n✅✅✅ FLAG FOUND!")
            matches = re.findall(r'.*flag.*', source, re.IGNORECASE)
            for match in matches:
                print(f"\n🎯 Match: {match.strip()}")
            flag_found = True
            return

        # Extract links manually to avoid stale references
        soup = BeautifulSoup(source, "html.parser")
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if href.startswith("/warplane/"):
                visit(href)

    except Exception as e:
        print(f"❌ Error visiting {full_url}: {e}")

print("🚀 Starting simulation...")
print("✅ Found start paths:", START_PATHS)

for path in START_PATHS:
    visit(path)

if not flag_found:
    print("❌ Flag not found after full traversal.")

driver.quit()
