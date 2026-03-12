# 🚀 Quick Start Guide

## Fastest Way to Run

```bash
cd /Users/ibrahimalamoudi/IdeaProjects/Osint-tool
source .venv/bin/activate
python osint_pro.py --targets zorg-saam.be zorgsaam.tobacube.be idp.assessmentq.com --full
```

## What You Get

After ~5 minutes, you'll have:

1. **Professional PDF Report** (`output/OSINT_Professional_Report_*.pdf`)
   - Executive summary
   - Risk assessment for each target
   - Subdomains discovered (with count)
   - Email addresses found
   - Technologies detected
   - Social media profiles
   - Security analysis
   - Recommendations

2. **Complete JSON Data** (`output/osint_scan_*.json`)
   - All raw data for further analysis

## Recent Scan Results

Your last scan found:

### zorg-saam.be
- ✅ Risk: MEDIUM (Score: 30)
- ✅ 13 subdomains discovered
- ✅ Organization: ClearMedia NV
- ✅ Hosted on: Proximus (77.241.81.229)
- ✅ Web Server: nginx
- ✅ Technologies: 2 detected

### zorgsaam.tobacube.be
- ✅ Risk: MEDIUM (Score: 30)
- ✅ Technologies: 1 detected

### idp.assessmentq.com
- ✅ Risk: MEDIUM (Score: 30)
- ✅ Full OSINT data collected

## View Reports

```bash
# Open output folder
open output/

# View latest PDF
open output/OSINT_Professional_Report_*.pdf

# View JSON data
cat output/osint_scan_*.json | jq
```

## Scan More Targets

```bash
# Single target
python osint_pro.py --targets newdomain.com --full

# Multiple targets
python osint_pro.py --targets domain1.com domain2.com domain3.com --full

# From file
echo "target1.com" > my_targets.txt
echo "target2.com" >> my_targets.txt
python osint_pro.py --file my_targets.txt --full
```

## Customize Scan

```bash
# Skip subdomains (faster)
python osint_pro.py --targets example.com --no-subdomains

# Skip email harvesting
python osint_pro.py --targets example.com --no-emails

# Custom output folder
python osint_pro.py --targets example.com --output-dir my_results
```

## Features Included

✅ **Domain Intelligence**
- WHOIS registration info
- DNS records (A, MX, NS, TXT, SOA)
- SSL/TLS certificate analysis

✅ **Enhanced Discovery**
- Subdomain enumeration (crt.sh + DNS)
- Email address harvesting
- Social media profile detection

✅ **Technology Profiling**
- Web server detection
- CMS identification (WordPress, Drupal, etc.)
- JavaScript library detection
- Framework identification

✅ **Security Analysis**
- HTTP security headers check
- Risk assessment scoring
- Vulnerability indicators

✅ **Professional Reporting**
- Multi-section PDF report
- Executive summary
- Detailed findings per target
- Security recommendations

## Need Help?

```bash
python osint_pro.py --help
```

## ⚠️ Remember

- Only scan targets you have authorization to test
- This tool performs passive OSINT only
- No active exploitation or vulnerability scanning
- Respect robots.txt and rate limits

---

**Happy Hunting! 🔍**
