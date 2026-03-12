# 🔍 Professional OSINT Reconnaissance Tool

A comprehensive passive OSINT (Open Source Intelligence) tool for professional security reconnaissance with enhanced intelligence gathering and professional reporting.

## ✨ Features

### Core Capabilities
- ✅ **Domain Intelligence** - WHOIS, DNS records, SSL/TLS certificates
- ✅ **Enhanced Subdomain Discovery** - Multiple sources (crt.sh + DNS brute-force)
- ✅ **Email Harvesting** - Automated email discovery from websites
- ✅ **Technology Detection** - Web server, CMS, frameworks, JavaScript libraries
- ✅ **Company Intelligence** - Organization information gathering
- ✅ **Social Media Discovery** - Automatic detection of social profiles
- ✅ **Shodan Integration** - Port scanning, vulnerabilities, service detection (optional)
- ✅ **Security Analysis** - HTTP security headers assessment
- ✅ **Risk Assessment** - Automated risk scoring and findings
- ✅ **Professional PDF Reports** - Formatted, multi-section reports
- ✅ **JSON Data Export** - Complete raw intelligence data

### Advanced Features
- 🎯 Multiple target types (domains, URLs, IP addresses)
- 📊 Risk-based color coding (HIGH/MEDIUM/LOW)
- 🔒 Passive reconnaissance only (legal & ethical)
- 📱 GUI application (osint_gui.py - requires Python 3.10+)
- 💻 Professional CLI (osint_pro.py - recommended)
- 📄 Comprehensive reporting with executive summary

## 🚀 Quick Start

### Method 1: Web-Based GUI ⭐ **RECOMMENDED**

```bash
# Start the web interface
./start_web_gui.sh

# Or manually:
source .venv/bin/activate
python osint_web_gui.py

# Then open: http://localhost:5001
```

**Features:**
- Beautiful modern interface
- Real-time scan progress
- Live output logs
- One-click PDF generation
- Shodan API key input
- Works on any system!

### Method 2: Professional CLI

```bash
# Activate virtual environment
source .venv/bin/activate

# Run professional scan
python osint_pro.py --targets zorg-saam.be zorgsaam.tobacube.be idp.assessmentq.com --full
```

### Method 3: Original Simple Version

```bash
# Run basic scan
./run.sh --targets zorg-saam.be zorgsaam.tobacube.be --full
```

## 📊 Output Files

After scanning, check the `output/` folder:

- **`OSINT_Professional_Report_[timestamp].pdf`** - Professional formatted report
  - Executive Summary
  - Risk Overview Table
  - Detailed findings per target
  - Technology stack analysis
  - Security recommendations
  
- **`osint_scan_[timestamp].json`** - Complete raw intelligence data
  - All collected data in structured format
  - Timestamps and metadata
  - Perfect for automated processing

## 📦 Installation

```bash
# Clone or navigate to project
cd Osint-tool

# Create virtual environment (if not exists)
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies (includes Shodan, Flask, pycryptodome)
pip install -r requirements.txt
```

### 🔑 Optional: Shodan API Key Setup

Shodan adds powerful features like port scanning and vulnerability detection:

1. **Get a free API key**: https://account.shodan.io/register
2. **Add to config.json**:
   ```json
   {
     "shodan_api_key": "YOUR_API_KEY_HERE",
     "haveibeenpwned_api_key": ""
   }
   ```
3. **Or enter via Web GUI** when scanning

See `SHODAN_SETUP.md` for detailed instructions.

**Without Shodan:** Tool works perfectly, just skips Shodan lookups.

## 🎯 Usage Examples

### Scan Multiple Domains
```bash
python osint_pro.py --targets example.com another.com third.com --full
```

### Scan from File
```bash
# Create targets.txt with one target per line
echo "zorg-saam.be" > targets.txt
echo "zorgsaam.tobacube.be" >> targets.txt

python osint_pro.py --file targets.txt --full
```

### Disable Specific Modules
```bash
# Skip subdomain discovery
python osint_pro.py --targets example.com --no-subdomains

# Skip email harvesting
python osint_pro.py --targets example.com --no-emails

# Skip social media discovery
python osint_pro.py --targets example.com --no-social
```

### Custom Output Directory
```bash
python osint_pro.py --targets example.com --output-dir my_scan_results
```

## 🔍 What Data is Collected?

### For Domain Targets:
1. **WHOIS Information** - Registration details, owner, dates
2. **DNS Records** - A, AAAA, MX, NS, TXT, CNAME, SOA
3. **SSL/TLS Certificate** - Issuer, expiry, validity
4. **HTTP Analysis** - Status, headers, meta tags, forms
5. **Subdomains** - crt.sh transparency logs + DNS brute-force
6. **Email Addresses** - Harvested from website and common pages
7. **Technologies** - Web server, CMS, frameworks, libraries
8. **Social Media** - Facebook, Twitter, LinkedIn, Instagram links
9. **Security Headers** - HSTS, CSP, X-Frame-Options, etc.
10. **Risk Assessment** - Automated scoring and findings

### For IP Addresses:
- IP WHOIS/RDAP lookup
- Network information
- Organization details

## 📋 Scan Results Example

```
═══ SCAN CONFIGURATION ═══
Targets: 3
Full Scan: Yes
Subdomain Discovery: Yes
Email Harvesting: Yes
Company Intelligence: Yes
Social Media Discovery: Yes

[1/3] Scanning: zorg-saam.be
────────────────────────────────────────────────
✓ Scan Complete
  Risk Level: MEDIUM (Score: 30)
  Subdomains Found: 13
  Technologies Detected: 2
```

## 🔒 Legal & Ethical Use

**⚠️ IMPORTANT: AUTHORIZED USE ONLY**

This tool is designed for **legal, authorized security testing only**:

- ✅ Only scan targets you have written permission to test
- ✅ Passive reconnaissance only (no active exploitation)
- ✅ Respect robots.txt and rate limits
- ✅ Follow your organization's security testing policies
- ❌ No brute force attacks
- ❌ No vulnerability exploitation
- ❌ No unauthorized access attempts
- ❌ No denial of service

This tool is for the **OSINT phase** of authorized penetration testing.

## 🛠️ Troubleshooting

### macOS SSL Warnings
```bash
# Install certificates (if needed)
/Applications/Python\ 3.9/Install\ Certificates.command
```

### GUI Won't Launch
The GUI requires Python 3.10+ with proper tkinter. Use the CLI version instead:
```bash
python osint_pro.py --targets [your-targets] --full
```

### Permission Errors
Always work inside the virtual environment:
```bash
source .venv/bin/activate
# Then run commands
```

## 📁 Project Structure

```
Osint-tool/
├── osint_web_gui.py          ⭐ Web-based GUI (RECOMMENDED)
├── osint_pro.py              💻 Professional CLI
├── osint_enhanced.py         🔧 Enhanced OSINT engine (with Shodan)
├── osint_gui.py              📱 Desktop GUI (tkinter)
├── osint_main.py             📝 Original simple version
├── requirements.txt          📦 All dependencies (Shodan, Flask, etc.)
├── config.json               🔑 API keys (create from example)
├── config_example.json       📋 API keys template
├── start_web_gui.sh          ▶️ Web GUI launcher
├── launch_gui.sh             🖥️ Desktop GUI launcher
├── run.sh                    ▶️ Simple version launcher
├── README.md                 📖 Main documentation
├── QUICK_START.md            🚀 Quick reference
├── SHODAN_SETUP.md           🔑 Shodan integration guide
└── output/                   📊 Scan results
    ├── OSINT_Professional_Report_*.pdf
    └── osint_scan_*.json
```

## 🎓 For Students & Researchers

This tool was developed for educational purposes and authorized security research:
- Howest University security research
- Authorized penetration testing projects
- Security awareness training
- OSINT methodology demonstrations

## 📝 License

Educational & Authorized Testing Use Only

---

**Made with 🔒 for Professional Security Research**
