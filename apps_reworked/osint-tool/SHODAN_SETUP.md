# 🔑 Shodan Integration Setup

Shodan is the world's most powerful search engine for Internet-connected devices. It provides deep intelligence about IPs, ports, vulnerabilities, and services.

## What Shodan Adds to Your Scans

When you add a Shodan API key, you'll get:

- ✅ **Open Ports** - All exposed ports on the IP
- ✅ **Services** - Detailed service information (Apache, nginx, etc.)
- ✅ **Vulnerabilities** - Known CVEs affecting the host
- ✅ **Operating System** - OS detection
- ✅ **Organization** - ISP/hosting provider details
- ✅ **Geolocation** - Country, city, coordinates
- ✅ **Hostnames** - All hostnames pointing to the IP
- ✅ **Historical Data** - Past scan results

## Getting a Shodan API Key

### Free Account (Limited)
1. Go to https://account.shodan.io/register
2. Sign up with your email
3. Verify your email
4. Go to https://account.shodan.io/
5. Copy your API key

**Free Limits:**
- 100 query credits/month
- 1 scan credit/month
- Basic search results

### Paid Account (Recommended for Professional Use)
- **Membership**: $49/month
- **Freelancer**: $59/month  
- **Corporate**: $899/month

**Benefits:**
- Unlimited query credits
- More scan credits
- Full API access
- Historical data
- Bulk lookups

## Adding Your API Key

### Method 1: Web GUI
1. Start the web GUI: `./start_web_gui.sh`
2. Open http://localhost:5001
3. Enter your Shodan API key in the "Shodan API Key" field
4. Click "Start Scan"

The key will be automatically saved to `config.json`.

### Method 2: Manual Configuration
1. Open `config.json` in the project folder
2. Add your API key:
```json
{
  "shodan_api_key": "YOUR_API_KEY_HERE",
  "haveibeenpwned_api_key": ""
}
```
3. Save the file

### Method 3: Command Line
```bash
# Edit config.json
nano config.json

# Or use echo
echo '{"shodan_api_key":"YOUR_KEY_HERE","haveibeenpwned_api_key":""}' > config.json
```

## Using Shodan in Scans

Once configured, Shodan lookups happen automatically:

### For Domain Targets:
- Queries all A record IPs
- Limited to first 3 IPs to save credits

### For IP Targets:
- Full host lookup with all details
- Includes vulnerability data

### For IP Ranges (CIDR):
- Network search across the range
- Returns top 5 matches

## Example Shodan Output

```json
{
  "shodan": {
    "77.241.81.229": {
      "host": {
        "ip": "77.241.81.229",
        "org": "Proximus NV",
        "os": "Linux",
        "ports": [80, 443, 22],
        "vulns": ["CVE-2021-XXXXX"],
        "hostnames": ["server.example.com"],
        "country": "Belgium",
        "city": "Brussels"
      }
    }
  }
}
```

## Checking Your Credits

### Via Shodan CLI:
```bash
# Install Shodan CLI
pip install shodan

# Initialize with your key
shodan init YOUR_API_KEY

# Check info
shodan info
```

### Via Web:
- https://account.shodan.io/

## Tips for Efficient Usage

1. **Scan Strategically**
   - Group similar targets together
   - Scan during off-peak hours for better performance

2. **Credit Management**
   - Each IP lookup = 1 query credit
   - Monitor your usage at https://account.shodan.io/

3. **Rate Limits**
   - Free: 1 request/second
   - Paid: Burst up to 10/second

4. **Best Practices**
   - Cache results to avoid duplicate queries
   - Use filters to narrow searches
   - Combine with other OSINT sources

## What if I Don't Have a Shodan Key?

No problem! The tool works perfectly without Shodan:
- All other OSINT features remain active
- Shodan sections show "skipped" status
- No errors or warnings

## Security Note

⚠️ **Protect Your API Key:**
- Never commit `config.json` to git
- Don't share your key publicly
- Regenerate if compromised
- Use environment variables in production

## Getting Help

- Shodan Documentation: https://developer.shodan.io/
- Shodan Help Center: https://help.shodan.io/
- Community: https://community.shodan.io/

---

**Ready to supercharge your OSINT scans with Shodan!** 🚀
