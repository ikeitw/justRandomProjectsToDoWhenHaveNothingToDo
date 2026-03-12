# 🎉 What's New - Enhanced OSINT Tool

## ✨ Major Updates

### 1. 🌐 Web-Based GUI (NEW!)

**Working modern web interface accessible from any browser!**

- **Launch:** `./start_web_gui.sh` or `python osint_web_gui.py`
- **Access:** http://localhost:5001
- **Status:** ✅ **WORKING** - No tkinter issues!

**Features:**
- 🎨 Beautiful gradient UI with modern design
- 📊 Real-time scan progress
- 📝 Live output logs with color coding
- 🔑 Shodan API key input field
- ⚙️ Configurable scan options (checkboxes)
- 📄 One-click PDF report generation
- 💾 Automatic result persistence
- 📥 Direct PDF download

**Why Web GUI?**
- Works on ANY Python version (no tkinter issues)
- Accessible from multiple devices on network
- Modern responsive interface
- No platform-specific dependencies

---

### 2. 🔍 Shodan Integration (NEW!)

**World's most powerful IoT search engine now integrated!**

**What You Get:**
- 🔓 **Open Ports** - All exposed services
- 🐛 **Vulnerabilities** - Known CVEs (CVE-2021-XXXXX, etc.)
- 💻 **OS Detection** - Operating system identification
- 🏢 **Organization** - ISP/hosting provider
- 🌍 **Geolocation** - Country, city, coordinates
- 🔧 **Service Details** - Apache, nginx, SSH versions
- 📡 **Hostnames** - All DNS names for the IP
- 📊 **Historical Data** - Past scan results

**How to Use:**

#### Via Web GUI:
1. Start web GUI: `./start_web_gui.sh`
2. Enter Shodan API key in the form
3. Click "Start Scan"
4. Key is auto-saved to config.json

#### Via config.json:
```json
{
  "shodan_api_key": "YOUR_KEY_HERE",
  "haveibeenpwned_api_key": ""
}
```

#### Get Free API Key:
1. Visit: https://account.shodan.io/register
2. Sign up (free account)
3. Copy API key from dashboard
4. Add to tool

**Free Limits:** 100 queries/month (plenty for testing!)

**Automatic Integration:**
- Domain scans → Queries all A record IPs
- IP scans → Full host lookup
- Network ranges → Network search

---

### 3. 🔒 Pycryptodome Added

**Enhanced cryptographic capabilities for:**
- Advanced SSL/TLS parsing
- Certificate validation
- Secure hash verification
- Future encryption features

---

## 📊 Enhanced Features

### Comprehensive Data Collection

**Now Includes:**
1. ✅ Domain WHOIS & DNS (A, MX, NS, TXT, SOA)
2. ✅ SSL/TLS certificate analysis
3. ✅ Enhanced subdomain discovery (crt.sh + DNS)
4. ✅ Email harvesting from websites
5. ✅ Technology stack detection
6. ✅ Social media profile discovery
7. ✅ **Shodan port/vuln scanning** ⭐ NEW
8. ✅ Security header analysis
9. ✅ Risk assessment scoring
10. ✅ Professional PDF reports

### Example Shodan Output

```json
{
  "shodan": {
    "77.241.81.229": {
      "host": {
        "ip": "77.241.81.229",
        "org": "Proximus NV",
        "os": "Linux",
        "ports": [80, 443, 22, 25],
        "vulns": ["CVE-2021-12345", "CVE-2022-67890"],
        "hostnames": ["mail.example.com"],
        "country": "Belgium",
        "city": "Brussels"
      }
    }
  }
}
```

---

## 🚀 How to Use Everything

### Option 1: Web GUI (Easiest)

```bash
# Start web server
./start_web_gui.sh

# Open browser to http://localhost:5001
# - Enter targets
# - Check scan options
# - Add Shodan key (optional)
# - Click "Start Scan"
# - Watch live progress
# - Click "Generate PDF Report"
```

### Option 2: Professional CLI

```bash
# Activate venv
source .venv/bin/activate

# Run scan
python osint_pro.py --targets example.com another.com --full

# PDF auto-generated in output/
```

### Option 3: Original Simple

```bash
# Quick scan
./run.sh --targets example.com --full
```

---

## 📦 Updated Dependencies

**New additions to `requirements.txt`:**
```
shodan>=1.25.0          # IoT search engine
pycryptodome>=3.19.0    # Advanced crypto
flask>=2.3.0            # Web framework
flask-cors>=4.0.0       # CORS support
```

**Install all:**
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

---

## 📁 New Files

```
✅ osint_web_gui.py      - Modern web interface
✅ start_web_gui.sh      - Web GUI launcher
✅ SHODAN_SETUP.md       - Shodan integration guide
✅ WHATS_NEW.md          - This file!
```

---

## 🎯 Quick Start Guide

### First Time Setup:
```bash
# 1. Navigate to project
cd /Users/ibrahimalamoudi/IdeaProjects/Osint-tool

# 2. Activate virtual environment
source .venv/bin/activate

# 3. Install new dependencies
pip install -r requirements.txt

# 4. (Optional) Add Shodan API key
echo '{"shodan_api_key":"YOUR_KEY","haveibeenpwned_api_key":""}' > config.json

# 5. Start web GUI
python osint_web_gui.py
```

### Open Browser:
```
http://localhost:5001
```

### Or Use CLI:
```bash
python osint_pro.py --targets example.com --full
```

---

## 🔥 What Makes This Special

### Before (Basic OSINT):
- Domain info
- DNS records
- Basic web scraping
- Simple PDF

### After (Professional OSINT):
- ✅ Everything above PLUS:
- ✅ **Shodan vulnerability scanning**
- ✅ **Port/service detection**
- ✅ **CVE identification**
- ✅ **OS fingerprinting**
- ✅ **Web-based GUI**
- ✅ **Real-time progress**
- ✅ **Enhanced subdomains**
- ✅ **Email harvesting**
- ✅ **Social media discovery**
- ✅ **Professional multi-section PDF**

---

## 💡 Pro Tips

### Maximize Shodan Value:
1. Scan IP ranges to find exposed services
2. Check vulnerability lists for patches
3. Use free account for testing
4. Upgrade to paid for production

### Efficient Scanning:
1. Use web GUI for interactive scans
2. Use CLI for automated/scheduled scans
3. Batch similar targets together
4. Monitor your Shodan credits

### Professional Reporting:
1. PDF includes all Shodan findings
2. Vulnerabilities listed in risk section
3. Port list shown per IP
4. Organization details included

---

## 🔒 Security & Ethics

**Remember:**
- ✅ Only scan authorized targets
- ✅ Passive reconnaissance only
- ✅ Shodan data is public information
- ✅ Follow responsible disclosure
- ❌ No active exploitation
- ❌ No unauthorized access
- ❌ Respect rate limits

---

## 📚 Documentation

- **`README.md`** - Complete documentation
- **`QUICK_START.md`** - Quick reference
- **`SHODAN_SETUP.md`** - Shodan integration
- **`WHATS_NEW.md`** - This file

---

## 🎓 Example Workflow

```bash
# 1. Start web GUI
./start_web_gui.sh

# 2. In browser (http://localhost:5001):
#    - Add targets: example.com, test.com
#    - Enter Shodan API key
#    - Check all scan options
#    - Click "Start Scan"

# 3. Watch real-time output
#    - See each module execute
#    - Monitor discovered subdomains
#    - View found emails
#    - Check Shodan results

# 4. Generate report
#    - Click "Generate PDF Report"
#    - PDF downloads automatically
#    - Review comprehensive findings

# 5. Review results
#    - Check vulnerabilities
#    - Note exposed ports
#    - Review technology stack
#    - Read recommendations
```

---

## 🏆 Summary

You now have a **professional-grade OSINT platform** with:

✅ Modern web interface (works everywhere)
✅ Shodan integration (vulnerability scanning)
✅ Enhanced subdomain discovery
✅ Email harvesting
✅ Social media detection
✅ Technology profiling
✅ Security analysis
✅ Risk scoring
✅ Professional PDF reports
✅ Real-time progress monitoring

**Ready to discover intelligence like a pro!** 🔍🚀

---

**Questions? Check the docs or just start scanning!**

```bash
./start_web_gui.sh
# Then open: http://localhost:5001
```
