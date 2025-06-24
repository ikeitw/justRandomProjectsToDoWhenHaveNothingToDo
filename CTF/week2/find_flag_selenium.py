from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
import time

# Setup headless Chrome
options = webdriver.ChromeOptions()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

base_url = "http://192.168.16.109:9204/warplane/"

try:
    for i in range(1, 1001):
        url = f"{base_url}{i}"
        print(f"🌐 Visiting: {url}")
        driver.get(url)

        time.sleep(0.5)  # Give it time to render

        try:
            flag = driver.find_element(By.ID, "Flag")
            print("🚩 FLAG FOUND at:", url)
            print("Flag element text:", flag.text)
            break
        except:
            continue

finally:
    driver.quit()
