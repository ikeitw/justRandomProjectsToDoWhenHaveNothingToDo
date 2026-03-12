#!/usr/bin/env python3
"""
Professional OSINT Tool - Command Line Interface
Enhanced reconnaissance with comprehensive professional reporting
"""
import argparse
import sys
from colorama import Fore, Style, init
from osint_enhanced import OsintScanner, ProfessionalReportGenerator

init(autoreset=True)

def print_banner():
    banner = f"""
{Fore.CYAN}╔═══════════════════════════════════════════════════════════════╗
║     🔍  PROFESSIONAL OSINT RECONNAISSANCE TOOL  🔍           ║
║                                                               ║
║          Comprehensive Security Intelligence Suite           ║
║                    Howest Security Research                   ║
╚═══════════════════════════════════════════════════════════════╝{Style.RESET_ALL}
"""
    print(banner)

def main():
    parser = argparse.ArgumentParser(
        description="Professional OSINT Tool - Comprehensive Intelligence Gathering",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --targets example.com another.com --full
  %(prog)s --file targets.txt --no-subdomains
  %(prog)s --targets example.com --pdf-only
  
Features:
  • Enhanced subdomain discovery (multiple sources)
  • Email harvesting from websites
  • Company/Organization intelligence
  • Social media presence detection
  • Technology stack fingerprinting
  • Security headers analysis
  • Professional PDF report generation
  • Comprehensive JSON data export
"""
    )
    
    parser.add_argument(
        '--targets', 
        nargs='+', 
        help='Target domains, URLs, or IP addresses (space-separated)'
    )
    parser.add_argument(
        '--file', 
        help='File containing targets (one per line)'
    )
    parser.add_argument(
        '--full', 
        action='store_true',
        default=True,
        help='Run full OSINT scan (default: enabled)'
    )
    parser.add_argument(
        '--no-subdomains', 
        action='store_true',
        help='Disable subdomain discovery'
    )
    parser.add_argument(
        '--no-emails', 
        action='store_true',
        help='Disable email harvesting'
    )
    parser.add_argument(
        '--no-company', 
        action='store_true',
        help='Disable company intelligence gathering'
    )
    parser.add_argument(
        '--no-social', 
        action='store_true',
        help='Disable social media discovery'
    )
    parser.add_argument(
        '--pdf-only', 
        action='store_true',
        help='Generate PDF report without scanning (requires existing JSON)'
    )
    parser.add_argument(
        '--output-dir', 
        default='output',
        help='Output directory for reports (default: output)'
    )
    
    args = parser.parse_args()
    
    print_banner()
    
    # Get targets
    targets = []
    if args.targets:
        targets.extend(args.targets)
    elif args.file:
        try:
            with open(args.file, 'r') as f:
                targets.extend([line.strip() for line in f if line.strip()])
        except FileNotFoundError:
            print(f"{Fore.RED}✗ Error: File '{args.file}' not found{Style.RESET_ALL}")
            sys.exit(1)
    else:
        print(f"{Fore.RED}✗ Error: No targets specified. Use --targets or --file{Style.RESET_ALL}")
        parser.print_help()
        sys.exit(1)
    
    # Scan configuration
    print(f"\n{Fore.CYAN}═══ SCAN CONFIGURATION ═══{Style.RESET_ALL}")
    print(f"Targets: {Fore.GREEN}{len(targets)}{Style.RESET_ALL}")
    print(f"Full Scan: {Fore.GREEN}{'Yes' if args.full else 'No'}{Style.RESET_ALL}")
    print(f"Subdomain Discovery: {Fore.GREEN}{'Yes' if not args.no_subdomains else 'No'}{Style.RESET_ALL}")
    print(f"Email Harvesting: {Fore.GREEN}{'Yes' if not args.no_emails else 'No'}{Style.RESET_ALL}")
    print(f"Company Intelligence: {Fore.GREEN}{'Yes' if not args.no_company else 'No'}{Style.RESET_ALL}")
    print(f"Social Media Discovery: {Fore.GREEN}{'Yes' if not args.no_social else 'No'}{Style.RESET_ALL}")
    print()
    
    # Create scanner
    def log_callback(message):
        print(message)
    
    scanner = OsintScanner(
        enable_subdomains=not args.no_subdomains,
        enable_emails=not args.no_emails,
        enable_company=not args.no_company,
        enable_social=not args.no_social,
        log_callback=log_callback
    )
    scanner.output_dir = args.output_dir
    
    # Scan each target
    print(f"{Fore.CYAN}═══ STARTING RECONNAISSANCE ═══{Style.RESET_ALL}\n")
    
    results = {}
    for i, target in enumerate(targets, 1):
        print(f"\n{Fore.YELLOW}[{i}/{len(targets)}] Scanning: {Fore.WHITE}{target}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'─' * 60}{Style.RESET_ALL}")
        
        try:
            result = scanner.scan_target(target)
            results[target] = result
            
            # Show quick summary
            risk = result.get('risk_assessment', {})
            risk_level = risk.get('level', 'UNKNOWN')
            risk_color = {'HIGH': Fore.RED, 'MEDIUM': Fore.YELLOW, 'LOW': Fore.GREEN}.get(risk_level, Fore.WHITE)
            
            print(f"\n{Fore.GREEN}✓ Scan Complete{Style.RESET_ALL}")
            print(f"  Risk Level: {risk_color}{risk_level}{Style.RESET_ALL} (Score: {risk.get('score', 0)})")
            
            # Show key findings
            if 'subdomains' in result:
                subdomain_count = len(result['subdomains'])
                if subdomain_count > 0:
                    print(f"  Subdomains Found: {Fore.CYAN}{subdomain_count}{Style.RESET_ALL}")
            
            if 'emails' in result:
                email_count = len(result['emails'])
                if email_count > 0:
                    print(f"  Emails Harvested: {Fore.CYAN}{email_count}{Style.RESET_ALL}")
            
            if 'technologies' in result:
                tech = result['technologies']
                if tech:
                    tech_items = sum(len(v) for v in tech.values())
                    print(f"  Technologies Detected: {Fore.CYAN}{tech_items}{Style.RESET_ALL}")
            
        except KeyboardInterrupt:
            print(f"\n{Fore.YELLOW}⚠ Scan interrupted by user{Style.RESET_ALL}")
            break
        except Exception as e:
            print(f"{Fore.RED}✗ Error scanning {target}: {str(e)}{Style.RESET_ALL}")
            results[target] = {"error": str(e)}
    
    # Save results
    scanner.results = results
    json_file = scanner.save_results()
    
    print(f"\n{Fore.CYAN}═══ GENERATING REPORTS ═══{Style.RESET_ALL}\n")
    print(f"{Fore.GREEN}✓ JSON data saved: {json_file}{Style.RESET_ALL}")
    
    # Generate PDF report
    try:
        print(f"{Fore.CYAN}📄 Generating professional PDF report...{Style.RESET_ALL}")
        generator = ProfessionalReportGenerator(results)
        pdf_file = generator.generate()
        print(f"{Fore.GREEN}✓ PDF report generated: {pdf_file}{Style.RESET_ALL}")
    except Exception as e:
        print(f"{Fore.RED}✗ PDF generation error: {str(e)}{Style.RESET_ALL}")
    
    # Final summary
    print(f"\n{Fore.CYAN}═══ SCAN COMPLETE ═══{Style.RESET_ALL}")
    print(f"\nTargets Scanned: {Fore.GREEN}{len(results)}{Style.RESET_ALL}")
    
    high_risk = sum(1 for r in results.values() if r.get('risk_assessment', {}).get('level') == 'HIGH')
    if high_risk > 0:
        print(f"High Risk Targets: {Fore.RED}{high_risk}{Style.RESET_ALL}")
    
    print(f"\n{Fore.YELLOW}💡 Tip: Review the PDF report for detailed findings and recommendations{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}💡 Open output folder: {Fore.WHITE}open {scanner.output_dir}{Style.RESET_ALL}\n")

if __name__ == "__main__":
    main()
