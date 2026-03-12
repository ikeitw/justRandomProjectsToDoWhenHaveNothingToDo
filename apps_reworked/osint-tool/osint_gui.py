#!/usr/bin/env python3
"""
Professional OSINT Tool - GUI Application
Enhanced reconnaissance with comprehensive reporting
"""
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox, filedialog
import threading
import json
import os
from datetime import datetime
from osint_enhanced import OsintScanner, ProfessionalReportGenerator

class OsintGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Professional OSINT Tool - Howest Security")
        self.root.geometry("1200x800")
        self.root.resizable(True, True)
        
        # Variables
        self.targets = tk.StringVar()
        self.scan_running = False
        self.scanner = None
        
        # Configure style
        style = ttk.Style()
        style.theme_use('clam')
        
        self.setup_ui()
        
    def setup_ui(self):
        """Create the user interface"""
        # Header Frame
        header_frame = ttk.Frame(self.root, padding="10")
        header_frame.grid(row=0, column=0, sticky=(tk.W, tk.E), columnspan=2)
        
        title_label = ttk.Label(
            header_frame, 
            text="🔍 Professional OSINT Reconnaissance Tool",
            font=('Helvetica', 18, 'bold')
        )
        title_label.grid(row=0, column=0, sticky=tk.W)
        
        subtitle_label = ttk.Label(
            header_frame,
            text="Comprehensive Intelligence Gathering & Analysis",
            font=('Helvetica', 10)
        )
        subtitle_label.grid(row=1, column=0, sticky=tk.W)
        
        # Separator
        ttk.Separator(self.root, orient='horizontal').grid(
            row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=5
        )
        
        # Left Panel - Input & Controls
        left_frame = ttk.LabelFrame(self.root, text="Target Configuration", padding="10")
        left_frame.grid(row=2, column=0, sticky=(tk.N, tk.W, tk.E, tk.S), padx=10, pady=5)
        
        # Targets Input
        ttk.Label(left_frame, text="Targets (one per line):", font=('Helvetica', 10, 'bold')).grid(
            row=0, column=0, sticky=tk.W, pady=(0, 5)
        )
        
        self.targets_text = scrolledtext.ScrolledText(
            left_frame, width=50, height=10, wrap=tk.WORD
        )
        self.targets_text.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        self.targets_text.insert('1.0', 'zorg-saam.be\nzorgsaam.tobacube.be\n109.135.69.8/29')
        
        # Scan Options
        options_frame = ttk.LabelFrame(left_frame, text="Scan Options", padding="5")
        options_frame.grid(row=2, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        self.full_scan_var = tk.BooleanVar(value=True)
        self.subdomain_var = tk.BooleanVar(value=True)
        self.email_var = tk.BooleanVar(value=True)
        self.company_var = tk.BooleanVar(value=True)
        self.social_var = tk.BooleanVar(value=True)
        
        ttk.Checkbutton(options_frame, text="Full OSINT Scan", variable=self.full_scan_var).grid(
            row=0, column=0, sticky=tk.W, pady=2
        )
        ttk.Checkbutton(options_frame, text="Enhanced Subdomain Discovery", variable=self.subdomain_var).grid(
            row=1, column=0, sticky=tk.W, pady=2
        )
        ttk.Checkbutton(options_frame, text="Email Harvesting", variable=self.email_var).grid(
            row=2, column=0, sticky=tk.W, pady=2
        )
        ttk.Checkbutton(options_frame, text="Company Intelligence", variable=self.company_var).grid(
            row=3, column=0, sticky=tk.W, pady=2
        )
        ttk.Checkbutton(options_frame, text="Social Media Discovery", variable=self.social_var).grid(
            row=4, column=0, sticky=tk.W, pady=2
        )
        
        # Control Buttons
        button_frame = ttk.Frame(left_frame)
        button_frame.grid(row=3, column=0, sticky=(tk.W, tk.E), pady=10)
        
        self.start_button = ttk.Button(
            button_frame, 
            text="🚀 Start Scan",
            command=self.start_scan,
            width=20
        )
        self.start_button.grid(row=0, column=0, padx=5)
        
        self.stop_button = ttk.Button(
            button_frame,
            text="⏹ Stop Scan",
            command=self.stop_scan,
            state='disabled',
            width=20
        )
        self.stop_button.grid(row=0, column=1, padx=5)
        
        # Progress
        self.progress = ttk.Progressbar(
            left_frame, 
            mode='indeterminate',
            length=300
        )
        self.progress.grid(row=4, column=0, sticky=(tk.W, tk.E), pady=10)
        
        # Status
        self.status_label = ttk.Label(
            left_frame,
            text="Ready to scan",
            font=('Helvetica', 9),
            foreground='green'
        )
        self.status_label.grid(row=5, column=0, sticky=tk.W)
        
        # Right Panel - Output
        right_frame = ttk.LabelFrame(self.root, text="Scan Output", padding="10")
        right_frame.grid(row=2, column=1, sticky=(tk.N, tk.W, tk.E, tk.S), padx=10, pady=5)
        
        # Output Text
        self.output_text = scrolledtext.ScrolledText(
            right_frame,
            width=70,
            height=30,
            wrap=tk.WORD,
            font=('Courier', 9)
        )
        self.output_text.grid(row=0, column=0, sticky=(tk.N, tk.W, tk.E, tk.S))
        
        # Export Buttons
        export_frame = ttk.Frame(right_frame)
        export_frame.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=10)
        
        ttk.Button(
            export_frame,
            text="📄 Generate PDF Report",
            command=self.generate_pdf,
            width=25
        ).grid(row=0, column=0, padx=5)
        
        ttk.Button(
            export_frame,
            text="💾 Save JSON Data",
            command=self.save_json,
            width=25
        ).grid(row=0, column=1, padx=5)
        
        ttk.Button(
            export_frame,
            text="📂 Open Output Folder",
            command=self.open_output_folder,
            width=25
        ).grid(row=0, column=2, padx=5)
        
        # Configure grid weights
        self.root.columnconfigure(1, weight=3)
        self.root.rowconfigure(2, weight=1)
        left_frame.columnconfigure(0, weight=1)
        right_frame.columnconfigure(0, weight=1)
        right_frame.rowconfigure(0, weight=1)
        
    def log(self, message, level="INFO"):
        """Log message to output"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        colors = {
            "INFO": "blue",
            "SUCCESS": "green",
            "WARNING": "orange",
            "ERROR": "red"
        }
        
        self.output_text.insert('end', f"[{timestamp}] {message}\n")
        self.output_text.see('end')
        self.root.update_idletasks()
        
    def update_status(self, message, color="black"):
        """Update status label"""
        self.status_label.config(text=message, foreground=color)
        
    def start_scan(self):
        """Start OSINT scan in background thread"""
        if self.scan_running:
            messagebox.showwarning("Scan Running", "A scan is already in progress!")
            return
            
        # Get targets
        targets_input = self.targets_text.get('1.0', 'end-1c').strip()
        if not targets_input:
            messagebox.showerror("No Targets", "Please enter at least one target!")
            return
            
        targets = [t.strip() for t in targets_input.split('\n') if t.strip()]
        
        # Clear output
        self.output_text.delete('1.0', 'end')
        
        # Update UI
        self.scan_running = True
        self.start_button.config(state='disabled')
        self.stop_button.config(state='normal')
        self.progress.start()
        self.update_status("Scanning in progress...", "blue")
        
        # Start scan thread
        scan_thread = threading.Thread(
            target=self.run_scan,
            args=(targets,),
            daemon=True
        )
        scan_thread.start()
        
    def run_scan(self, targets):
        """Execute the OSINT scan"""
        try:
            self.log("=" * 60)
            self.log("PROFESSIONAL OSINT SCAN INITIATED", "INFO")
            self.log("=" * 60)
            self.log(f"Targets: {len(targets)}")
            self.log(f"Full Scan: {self.full_scan_var.get()}")
            self.log(f"Subdomain Discovery: {self.subdomain_var.get()}")
            self.log(f"Email Harvesting: {self.email_var.get()}")
            self.log(f"Company Intelligence: {self.company_var.get()}")
            self.log(f"Social Media: {self.social_var.get()}")
            self.log("")
            
            # Create scanner
            self.scanner = OsintScanner(
                enable_subdomains=self.subdomain_var.get(),
                enable_emails=self.email_var.get(),
                enable_company=self.company_var.get(),
                enable_social=self.social_var.get(),
                log_callback=self.log
            )
            
            # Scan each target
            results = {}
            for i, target in enumerate(targets, 1):
                self.log(f"\n[{i}/{len(targets)}] Scanning: {target}", "INFO")
                self.update_status(f"Scanning {target} ({i}/{len(targets)})", "blue")
                
                result = self.scanner.scan_target(target)
                results[target] = result
                
                self.log(f"✓ Completed: {target}", "SUCCESS")
            
            # Save results
            self.scanner.results = results
            self.scanner.save_results()
            
            self.log("\n" + "=" * 60)
            self.log("✓ SCAN COMPLETED SUCCESSFULLY", "SUCCESS")
            self.log("=" * 60)
            self.log(f"\nResults saved to: {self.scanner.output_dir}")
            self.log("Click 'Generate PDF Report' to create professional report")
            
            self.update_status("Scan completed successfully!", "green")
            
        except Exception as e:
            self.log(f"\n✗ ERROR: {str(e)}", "ERROR")
            self.update_status("Scan failed - see output for details", "red")
            messagebox.showerror("Scan Error", f"An error occurred:\n{str(e)}")
            
        finally:
            self.scan_running = False
            self.start_button.config(state='normal')
            self.stop_button.config(state='disabled')
            self.progress.stop()
            
    def stop_scan(self):
        """Stop the running scan"""
        if self.scanner:
            self.scanner.stop_flag = True
        self.scan_running = False
        self.update_status("Scan stopped by user", "orange")
        self.log("\n⚠ Scan stopped by user", "WARNING")
        
    def generate_pdf(self):
        """Generate professional PDF report"""
        if not self.scanner or not self.scanner.results:
            messagebox.showwarning("No Data", "Please run a scan first!")
            return
            
        try:
            self.log("\n📄 Generating professional PDF report...")
            self.update_status("Generating PDF report...", "blue")
            
            generator = ProfessionalReportGenerator(self.scanner.results)
            pdf_path = generator.generate()
            
            self.log(f"✓ PDF Report generated: {pdf_path}", "SUCCESS")
            self.update_status("PDF report generated!", "green")
            
            # Ask to open
            if messagebox.askyesno("Report Generated", "PDF report generated successfully!\n\nOpen now?"):
                os.system(f'open "{pdf_path}"')
                
        except Exception as e:
            self.log(f"✗ PDF Generation Error: {str(e)}", "ERROR")
            messagebox.showerror("PDF Error", f"Failed to generate PDF:\n{str(e)}")
            
    def save_json(self):
        """Save results as JSON"""
        if not self.scanner or not self.scanner.results:
            messagebox.showwarning("No Data", "Please run a scan first!")
            return
            
        filepath = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
            initialfile=f"osint_scan_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        
        if filepath:
            try:
                with open(filepath, 'w') as f:
                    json.dump(self.scanner.results, f, indent=2, default=str)
                self.log(f"✓ JSON data saved: {filepath}", "SUCCESS")
                messagebox.showinfo("Saved", f"Data saved to:\n{filepath}")
            except Exception as e:
                messagebox.showerror("Save Error", f"Failed to save JSON:\n{str(e)}")
                
    def open_output_folder(self):
        """Open the output folder"""
        output_dir = "output"
        if os.path.exists(output_dir):
            os.system(f'open "{output_dir}"')
        else:
            messagebox.showwarning("No Output", "Output folder doesn't exist yet. Run a scan first!")

def main():
    root = tk.Tk()
    app = OsintGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()
