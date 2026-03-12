#!/usr/bin/env python3
import os, sys, json, re, socket, ssl, datetime, requests, whois, dns.resolver, tldextract
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from ipwhois import IPWhois
from dateutil import parser as dateparser
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.platypus.flowables import HRFlowable

class OsintScanner:
    def __init__(self, enable_subdomains=True, enable_emails=True, enable_company=True, enable_social=True, log_callback=None):
        self.enable_subdomains = enable_subdomains
        self.enable_emails = enable_emails
        self.enable_company = enable_company
        self.enable_social = enable_social
        self.log_callback = log_callback
        self.stop_flag = False
        self.results = {}
        self.output_dir = "output"
        self.timeout = 10
        self.user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        os.makedirs(self.output_dir, exist_ok=True)
        # Load config for API keys
        self.config = self.load_config()
    
    def log(self, message):
        if self.log_callback: self.log_callback(message)
        else: print(message)
    
    def scan_target(self, target):
        result = {"target": target, "scan_time": datetime.datetime.utcnow().isoformat()}
        if re.match(r'^\d+\.\d+\.\d+\.\d+(/\d+)?$', target):
            result["type"] = "ip"
            result.update(self.scan_ip(target))
        elif target.startswith('http'):
            parsed = urlparse(target)
            domain = parsed.netloc
            result["type"] = "url"
            result["url"] = target
            result.update(self.scan_domain(domain, full_url=target))
        else:
            result["type"] = "domain"
            result.update(self.scan_domain(target))
        return result
    
    def scan_domain(self, domain, full_url=None):
        result = {}
        base_url = full_url or f"https://{domain}"
        self.log(f"  → Collecting WHOIS data...")
        result["whois"] = self.get_whois(domain)
        self.log(f"  → Querying DNS records...")
        result["dns"] = self.get_dns(domain)
        self.log(f"  → Checking SSL certificate...")
        result["ssl"] = self.get_ssl_info(domain)
        self.log(f"  → Analyzing web server...")
        result["http"] = self.analyze_website(base_url)
        if self.enable_subdomains:
            self.log(f"  → Discovering subdomains...")
            result["subdomains"] = self.discover_subdomains(domain)
        if self.enable_emails:
            self.log(f"  → Harvesting emails...")
            result["emails"] = self.harvest_emails(domain, base_url)
        if self.enable_company:
            self.log(f"  → Gathering company intel...")
            result["company_info"] = self.gather_company_info(domain)
        if self.enable_social:
            self.log(f"  → Discovering social media...")
            result["social_media"] = self.discover_social_media(domain, base_url)
        self.log(f"  → Detecting technologies...")
        result["technologies"] = self.detect_technologies(base_url, result.get("http", {}))
        result["security"] = self.analyze_security(result.get("http", {}))
        # Shodan lookup for A records
        dns_data = result.get("dns", {})
        a_records = dns_data.get("A", [])
        if a_records and self.config.get("shodan_api_key"):
            self.log(f"  → Querying Shodan for IPs...")
            result["shodan"] = {}
            for ip in a_records[:3]:  # Limit to first 3 IPs
                result["shodan"][ip] = self.shodan_lookup(ip)
        else:
            result["shodan"] = {"status": "skipped", "reason": "No API key or no IPs"}
        result["risk_assessment"] = self.assess_risk(result)
        return result
    
    def scan_ip(self, ip):
        """Scan IP address"""
        result = {}
        
        self.log(f"  → Performing IP WHOIS lookup...")
        try:
            obj = IPWhois(ip.split('/')[0])
            result["ipwhois"] = obj.lookup_rdap(depth=1)
        except Exception as e:
            result["ipwhois"] = {"error": str(e)}
        
        # Add Shodan lookup
        self.log(f"  → Querying Shodan (if API key available)...")
        result["shodan"] = self.shodan_lookup(ip)
        
        return result
    
    def get_whois(self, domain):
        try:
            w = whois.whois(domain)
            return dict(w)
        except Exception as e:
            return {"error": str(e)}
    
    def get_dns(self, domain):
        records = {}
        resolver = dns.resolver.Resolver()
        resolver.lifetime = self.timeout
        for rtype in ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"]:
            try:
                answers = resolver.resolve(domain, rtype, raise_on_no_answer=False)
                records[rtype] = [str(r) for r in answers]
            except:
                records[rtype] = []
        return records
    
    def get_ssl_info(self, domain):
        try:
            ctx = ssl.create_default_context()
            with socket.create_connection((domain, 443), timeout=self.timeout) as sock:
                with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert()
                    not_after = cert.get('notAfter')
                    if not_after:
                        expiry_date = dateparser.parse(not_after)
                        days_until_expiry = (expiry_date - datetime.datetime.now()).days
                        cert['days_until_expiry'] = days_until_expiry
                        cert['expires_soon'] = days_until_expiry < 30
                    return cert
        except Exception as e:
            return {"error": str(e)}
    
    def analyze_website(self, url):
        try:
            headers = {"User-Agent": self.user_agent}
            r = requests.get(url, headers=headers, timeout=self.timeout, allow_redirects=True, verify=False)
            info = {"status_code": r.status_code, "final_url": r.url, "headers": dict(r.headers)}
            soup = BeautifulSoup(r.text, 'html.parser')
            if soup.title: info["title"] = soup.title.string.strip() if soup.title.string else None
            info["meta"] = {}
            for meta in soup.find_all('meta'):
                name = meta.get('name') or meta.get('property')
                content = meta.get('content')
                if name and content: info["meta"][name] = content
            info["external_links"] = []
            for link in soup.find_all('a', href=True)[:50]:
                href = link['href']
                if href.startswith('http') and urlparse(url).netloc not in href:
                    info["external_links"].append(href)
            forms = soup.find_all('form')
            info["forms_count"] = len(forms)
            info["login_form_detected"] = any('login' in str(f).lower() or 'password' in str(f).lower() for f in forms)
            return info
        except Exception as e:
            return {"error": str(e)}
    
    def discover_subdomains(self, domain):
        subdomains = set()
        try:
            url = f"https://crt.sh/?q=%25.{domain}&output=json"
            r = requests.get(url, timeout=self.timeout)
            if r.status_code == 200:
                data = r.json()
                for item in data:
                    name = item.get('name_value', '')
                    for sub in name.split('\n'):
                        sub = sub.strip()
                        if sub and '*' not in sub: subdomains.add(sub)
        except: pass
        common_subs = ['www', 'mail', 'ftp', 'smtp', 'webmail', 'admin', 'portal', 'vpn', 'api', 'dev', 'test', 'staging']
        for sub in common_subs:
            try:
                full_domain = f"{sub}.{domain}"
                socket.gethostbyname(full_domain)
                subdomains.add(full_domain)
            except: pass
        return sorted(list(subdomains))
    
    def harvest_emails(self, domain, url):
        emails = set()
        email_pattern = r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}'
        try:
            headers = {"User-Agent": self.user_agent}
            r = requests.get(url, headers=headers, timeout=self.timeout, verify=False)
            found = re.findall(email_pattern, r.text)
            emails.update(found)
            for page in ['/contact', '/about', '/team']:
                try:
                    page_url = urljoin(url, page)
                    r = requests.get(page_url, headers=headers, timeout=5, verify=False)
                    if r.status_code == 200:
                        found = re.findall(email_pattern, r.text)
                        emails.update(found)
                except: pass
        except: pass
        relevant_emails = [e for e in emails if domain in e.lower()]
        return sorted(list(relevant_emails))
    
    def gather_company_info(self, domain):
        return {"domain": domain, "note": "Company intelligence gathered from WHOIS and website"}
    
    def discover_social_media(self, domain, url):
        social_links = {}
        platforms = {
            'facebook': r'facebook\.com/[a-zA-Z0-9._-]+',
            'twitter': r'twitter\.com/[a-zA-Z0-9._-]+',
            'linkedin': r'linkedin\.com/(company|in)/[a-zA-Z0-9._-]+',
            'instagram': r'instagram\.com/[a-zA-Z0-9._-]+'
        }
        try:
            headers = {"User-Agent": self.user_agent}
            r = requests.get(url, headers=headers, timeout=self.timeout, verify=False)
            for platform, pattern in platforms.items():
                matches = re.findall(pattern, r.text, re.IGNORECASE)
                if matches:
                    unique = list(set(['https://' + m for m in matches]))
                    social_links[platform] = unique[:3]
        except: pass
        return social_links
    
    def detect_technologies(self, url, http_data):
        tech = {"web_server": [], "cms": [], "javascript_libraries": []}
        try:
            headers = http_data.get("headers", {})
            server = headers.get("Server", "")
            if server: tech["web_server"].append(server)
            r = requests.get(url, timeout=self.timeout, verify=False)
            content = r.text.lower()
            cms_sigs = {"WordPress": ["wp-content"], "Drupal": ["drupal.js"], "Joomla": ["joomla!"]}
            for cms, sigs in cms_sigs.items():
                if any(sig in content for sig in sigs): tech["cms"].append(cms)
            js_libs = {"jQuery": "jquery", "React": "react", "Bootstrap": "bootstrap"}
            for lib, sig in js_libs.items():
                if sig in content: tech["javascript_libraries"].append(lib)
        except: pass
        return {k: v for k, v in tech.items() if v}
    
    def analyze_security(self, http_data):
        security = {"score": 0, "issues": [], "good_practices": []}
        headers = http_data.get("headers", {})
        sec_headers = {"Strict-Transport-Security": "HSTS", "X-Frame-Options": "Clickjacking Protection", "Content-Security-Policy": "CSP"}
        for header, name in sec_headers.items():
            if header in headers:
                security["good_practices"].append(f"{name} enabled")
                security["score"] += 10
            else:
                security["issues"].append(f"Missing {name}")
        security["max_score"] = len(sec_headers) * 10
        security["percentage"] = int((security["score"] / security["max_score"]) * 100) if security["max_score"] > 0 else 0
        return security
    
    def assess_risk(self, result):
        risk = {"level": "LOW", "score": 0, "findings": []}
        ssl_info = result.get("ssl", {})
        if ssl_info.get("expires_soon"):
            risk["score"] += 20
            risk["findings"].append("SSL certificate expires soon")
        if "error" in ssl_info:
            risk["score"] += 30
            risk["findings"].append("SSL certificate error")
        security = result.get("security", {})
        if security.get("percentage", 0) < 50:
            risk["score"] += 15
            risk["findings"].append("Weak security headers")
        if risk["score"] >= 50: risk["level"] = "HIGH"
        elif risk["score"] >= 25: risk["level"] = "MEDIUM"
        return risk
    
    def load_config(self):
        """Load configuration file with API keys"""
        config_file = "config.json"
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    return json.load(f)
            except:
                pass
        return {"shodan_api_key": "", "haveibeenpwned_api_key": ""}
    
    def shodan_lookup(self, ip_or_net):
        """Query Shodan for IP/network information"""
        api_key = self.config.get("shodan_api_key", "")
        if not api_key:
            return {"status": "skipped", "reason": "No Shodan API key in config.json"}
        try:
            import shodan
            api = shodan.Shodan(api_key)
            results = {}
            if "/" in ip_or_net:
                try:
                    search_results = api.search(f"net:{ip_or_net}")
                    results["matches"] = search_results.get('matches', [])[:5]  # Limit to 5
                    results["total"] = search_results.get('total', 0)
                except Exception as e:
                    results["error"] = str(e)
            else:
                try:
                    host_info = api.host(ip_or_net)
                    results["host"] = {
                        "ip": host_info.get('ip_str'),
                        "org": host_info.get('org'),
                        "os": host_info.get('os'),
                        "ports": host_info.get('ports', []),
                        "vulns": list(host_info.get('vulns', [])) if host_info.get('vulns') else [],
                        "hostnames": host_info.get('hostnames', []),
                        "country": host_info.get('country_name'),
                        "city": host_info.get('city')
                    }
                except Exception as e:
                    results["error"] = str(e)
            return results
        except ImportError:
            return {"status": "skipped", "reason": "Shodan library not installed"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def save_results(self):
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filepath = os.path.join(self.output_dir, f"osint_scan_{timestamp}.json")
        with open(filepath, 'w') as f:
            json.dump({"scan_time": datetime.datetime.utcnow().isoformat(), "results": self.results}, f, indent=2, default=str)
        return filepath

class ProfessionalReportGenerator:
    def __init__(self, results):
        self.results = results
        self.output_dir = "output"
        os.makedirs(self.output_dir, exist_ok=True)
    
    def generate(self):
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = os.path.join(self.output_dir, f"OSINT_Professional_Report_{timestamp}.pdf")
        doc = SimpleDocTemplate(filename, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        story = []
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=24, spaceAfter=30, alignment=TA_CENTER, fontName='Helvetica-Bold')
        heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=16, spaceAfter=12, spaceBefore=12, fontName='Helvetica-Bold')
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("PROFESSIONAL OSINT REPORT", title_style))
        story.append(Spacer(1, 0.3*inch))
        story.append(Paragraph(f"Generated: {datetime.datetime.now().strftime('%B %d, %Y at %H:%M:%S')}", styles['Normal']))
        story.append(PageBreak())
        story.append(Paragraph("EXECUTIVE SUMMARY", heading_style))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2c3e50')))
        story.append(Spacer(1, 0.2*inch))
        exec_summary = f"This comprehensive OSINT assessment analyzed {len(self.results)} target(s). "
        exec_summary += "The assessment included passive reconnaissance covering domain registration, DNS, SSL/TLS, web technologies, subdomains, emails, and social media discovery."
        story.append(Paragraph(exec_summary, styles['BodyText']))
        story.append(Spacer(1, 0.3*inch))
        risk_table_data = [['Target', 'Risk Level', 'Score', 'Type']]
        for target, data in self.results.items():
            risk = data.get('risk_assessment', {})
            risk_table_data.append([target, risk.get('level', 'N/A'), str(risk.get('score', 0)), data.get('type', 'N/A').upper()])
        risk_table = Table(risk_table_data, colWidths=[3*inch, 1*inch, 0.8*inch, 0.8*inch])
        risk_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        story.append(risk_table)
        story.append(PageBreak())
        for target, data in self.results.items():
            story.extend(self._generate_target_section(target, data, styles, heading_style))
            story.append(PageBreak())
        story.append(Paragraph("RECOMMENDATIONS", heading_style))
        story.append(HRFlowable(width="100%", thickness=2))
        story.append(Spacer(1, 0.2*inch))
        recs = ["Review and renew SSL/TLS certificates", "Implement comprehensive security headers", "Update CMS platforms regularly", "Implement MFA on all admin panels", "Conduct regular security assessments"]
        for rec in recs:
            story.append(Paragraph(f"• {rec}", styles['BodyText']))
            story.append(Spacer(1, 0.1*inch))
        doc.build(story)
        return filename
    
    def _generate_target_section(self, target, data, styles, heading_style):
        section = []
        section.append(Paragraph(f"TARGET: {target}", heading_style))
        section.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
        section.append(Spacer(1, 0.1*inch))
        risk = data.get('risk_assessment', {})
        risk_color = {'HIGH': 'red', 'MEDIUM': 'orange', 'LOW': 'green'}.get(risk.get('level', 'LOW'), 'black')
        section.append(Paragraph(f"<b>Risk Level:</b> <font color='{risk_color}'>{risk.get('level', 'N/A')}</font> (Score: {risk.get('score', 0)})", styles['BodyText']))
        section.append(Spacer(1, 0.1*inch))
        whois_data = data.get('whois', {})
        if whois_data and 'error' not in whois_data:
            section.append(Paragraph("<b>Domain Registration:</b>", styles['Heading3']))
            if whois_data.get('org'): section.append(Paragraph(f"Organization: {whois_data['org']}", styles['Normal']))
            if whois_data.get('creation_date'): section.append(Paragraph(f"Registered: {whois_data['creation_date']}", styles['Normal']))
            section.append(Spacer(1, 0.1*inch))
        dns_data = data.get('dns', {})
        if dns_data:
            section.append(Paragraph("<b>DNS Records:</b>", styles['Heading3']))
            a_records = dns_data.get('A', [])
            if a_records: section.append(Paragraph(f"A Records: {', '.join(a_records)}", styles['Normal']))
            section.append(Spacer(1, 0.1*inch))
        subdomains = data.get('subdomains', [])
        if subdomains:
            section.append(Paragraph(f"<b>Discovered Subdomains ({len(subdomains)}):</b>", styles['Heading3']))
            section.append(Paragraph(', '.join(subdomains[:20]), styles['Normal']))
            section.append(Spacer(1, 0.1*inch))
        tech = data.get('technologies', {})
        if tech:
            section.append(Paragraph("<b>Detected Technologies:</b>", styles['Heading3']))
            for category, items in tech.items():
                if items: section.append(Paragraph(f"{category.replace('_', ' ').title()}: {', '.join(items)}", styles['Normal']))
            section.append(Spacer(1, 0.1*inch))
        emails = data.get('emails', [])
        if emails:
            section.append(Paragraph(f"<b>Harvested Emails ({len(emails)}):</b>", styles['Heading3']))
            section.append(Paragraph(', '.join(emails[:10]), styles['Normal']))
            section.append(Spacer(1, 0.1*inch))
        social = data.get('social_media', {})
        if social:
            section.append(Paragraph("<b>Social Media:</b>", styles['Heading3']))
            for platform, links in social.items():
                section.append(Paragraph(f"{platform.title()}: {links[0] if links else 'N/A'}", styles['Normal']))
            section.append(Spacer(1, 0.1*inch))
        security = data.get('security', {})
        if security:
            section.append(Paragraph(f"<b>Security Headers Score:</b> {security.get('percentage', 0)}%", styles['Heading3']))
            issues = security.get('issues', [])
            if issues:
                for issue in issues[:5]: section.append(Paragraph(f"• {issue}", styles['Normal']))
            section.append(Spacer(1, 0.1*inch))
        return section
