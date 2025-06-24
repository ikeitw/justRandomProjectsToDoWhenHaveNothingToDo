from Crypto.Hash import MD4

# Replace with the real NTLM hash
target_hash = "31d6cfe0d16ae931b73c59d7e0c089c0"

# Loop through possible passwords
for i in range(10000):
    password = f"HCTF-FLAG-{i:04}"
    h = MD4.new()
    h.update(password.encode('utf-16le'))
    hash_candidate = h.hexdigest().upper()

    if hash_candidate == target_hash:
        print(f"[+] Password found: {password}")
        break
else:
    print("[-] Password not found.")
