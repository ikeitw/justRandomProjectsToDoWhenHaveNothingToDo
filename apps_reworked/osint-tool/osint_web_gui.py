#!/usr/bin/env python3
"""
Professional OSINT Tool - Web-Based GUI
Works on any system with any Python version
"""
from flask import Flask, render_template_string, request, jsonify, send_file
from flask_cors import CORS
import threading
import json
import os
from datetime import datetime

from ipwhois.scripts import urllib3

from osint_enhanced import OsintScanner, ProfessionalReportGenerator
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
app = Flask(__name__)
CORS(app)

# Global state
current_scan = {
    "running": False,
    "progress": "",
    "logs": [],
    "results": None,
    "scanner": None
}

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional OSINT Tool</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1em; }
        .content {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 20px;
            padding: 30px;
        }
        .panel {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
        }
        .panel h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        label {
            display: block;
            margin: 10px 0 5px;
            font-weight: 600;
            color: #333;
        }
        textarea, input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            font-family: 'Courier New', monospace;
            transition: border-color 0.3s;
        }
        textarea:focus, input:focus {
            outline: none;
            border-color: #667eea;
        }
        textarea { height: 120px; resize: vertical; }
        .options {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 15px 0;
        }
        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            padding: 8px;
            border-radius: 5px;
            transition: background 0.2s;
        }
        .checkbox-label:hover { background: #e8eaf6; }
        .checkbox-label input { width: auto; margin: 0; }
        .btn {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
        }
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); }
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        .btn-success {
            background: #28a745;
            color: white;
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
        }
        .output {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            max-height: 600px;
            overflow-y: auto;
            line-height: 1.6;
        }
        .output::-webkit-scrollbar { width: 8px; }
        .output::-webkit-scrollbar-track { background: #2d2d30; }
        .output::-webkit-scrollbar-thumb { background: #667eea; border-radius: 4px; }
        .status {
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-weight: 600;
        }
        .status-idle { background: #e8f5e9; color: #2e7d32; }
        .status-running { background: #fff3e0; color: #e65100; }
        .status-complete { background: #e3f2fd; color: #1565c0; }
        .log-line { margin: 2px 0; }
        .log-info { color: #4fc3f7; }
        .log-success { color: #66bb6a; }
        .log-warning { color: #ffa726; }
        .log-error { color: #ef5350; }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .scanning { animation: pulse 1.5s infinite; }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
        }
        .api-key-input {
            margin-top: 15px;
            padding: 15px;
            background: #fff3cd;
            border-radius: 8px;
            border: 2px solid #ffc107;
        }
        .api-key-input h3 {
            color: #856404;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Professional OSINT Tool</h1>
            <p>Comprehensive Security Intelligence & Reconnaissance</p>
        </div>
        
        <div class="content">
            <div class="panel">
                <h2>⚙️ Configuration</h2>
                <label>Targets (one per line):</label>
                <textarea id="targets" placeholder="example.com&#10;another.com&#10;192.168.1.1">zorg-saam.be
zorgsaam.tobacube.be
idp.assessmentq.com</textarea>
                
                <label style="margin-top: 15px;">Scan Options:</label>
                <div class="options">
                    <label class="checkbox-label">
                        <input type="checkbox" id="subdomains" checked>
                        Subdomain Discovery
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="emails" checked>
                        Email Harvesting
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="company" checked>
                        Company Intel
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="social" checked>
                        Social Media
                    </label>
                </div>
                
                <div class="api-key-input">
                    <h3>🔑 Shodan API Key (Optional)</h3>
                    <input type="password" id="shodan_key" placeholder="Enter Shodan API key...">
                    <small style="display: block; margin-top: 5px; color: #856404;">
                        Leave empty to skip Shodan lookups
                    </small>
                </div>
                
                <button class="btn btn-primary" id="startBtn" onclick="startScan()">
                    🚀 Start Scan
                </button>
                <button class="btn btn-secondary" id="stopBtn" onclick="stopScan()" disabled>
                    ⏹ Stop Scan
                </button>
                <button class="btn btn-success" id="pdfBtn" onclick="generatePDF()" disabled>
                    📄 Generate PDF Report
                </button>
                
                <div id="statusBox" class="status status-idle">
                    Ready to scan
                </div>
            </div>
            
            <div class="panel">
                <h2>📊 Output</h2>
                <div class="output" id="output">
                    <div class="log-info">Welcome to Professional OSINT Tool!</div>
                    <div class="log-info">Configure your targets and click "Start Scan"</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            Made with 🔒 for Professional Security Research | Howest University
        </div>
    </div>

    <script>
        let pollInterval = null;
        
        function log(message, type = 'info') {
            const output = document.getElementById('output');
            const line = document.createElement('div');
            line.className = 'log-line log-' + type;
            line.textContent = message;
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
        }
        
        function updateStatus(message, className) {
            const box = document.getElementById('statusBox');
            box.textContent = message;
            box.className = 'status ' + className;
        }
        
        async function saveApiKey() {
            const apiKey = document.getElementById('shodan_key').value;
            if (apiKey) {
                await fetch('/api/save-config', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({shodan_api_key: apiKey})
                });
            }
        }
        
        async function startScan() {
            await saveApiKey();
            
            const targets = document.getElementById('targets').value.split('\\n')
                .map(t => t.trim()).filter(t => t);
            
            if (targets.length === 0) {
                alert('Please enter at least one target!');
                return;
            }
            
            const options = {
                targets: targets,
                subdomains: document.getElementById('subdomains').checked,
                emails: document.getElementById('emails').checked,
                company: document.getElementById('company').checked,
                social: document.getElementById('social').checked
            };
            
            document.getElementById('startBtn').disabled = true;
            document.getElementById('stopBtn').disabled = false;
            document.getElementById('pdfBtn').disabled = true;
            document.getElementById('output').innerHTML = '';
            updateStatus('Scan in progress...', 'status-running scanning');
            
            try {
                const response = await fetch('/api/start-scan', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(options)
                });
                
                if (response.ok) {
                    log('Scan started successfully!', 'success');
                    pollStatus();
                }
            } catch (error) {
                log('Error starting scan: ' + error, 'error');
                resetButtons();
            }
        }
        
        async function stopScan() {
            await fetch('/api/stop-scan', {method: 'POST'});
            log('Scan stopped by user', 'warning');
            resetButtons();
        }
        
        function resetButtons() {
            document.getElementById('startBtn').disabled = false;
            document.getElementById('stopBtn').disabled = true;
            if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
            }
        }
        
        async function pollStatus() {
            pollInterval = setInterval(async () => {
                try {
                    const response = await fetch('/api/status');
                    const data = await response.json();
                    
                    // Update logs
                    if (data.logs && data.logs.length > 0) {
                        data.logs.forEach(logMsg => {
                            log(logMsg, 'info');
                        });
                    }
                    
                    // Check if complete
                    if (!data.running) {
                        clearInterval(pollInterval);
                        pollInterval = null;
                        document.getElementById('startBtn').disabled = false;
                        document.getElementById('stopBtn').disabled = true;
                        document.getElementById('pdfBtn').disabled = false;
                        updateStatus('Scan complete!', 'status-complete');
                        log('✓ Scan completed successfully!', 'success');
                        log('Click "Generate PDF Report" to create your report', 'info');
                    }
                } catch (error) {
                    console.error('Poll error:', error);
                }
            }, 1000);
        }
        
        async function generatePDF() {
            log('Generating professional PDF report...', 'info');
            try {
                const response = await fetch('/api/generate-pdf', {method: 'POST'});
                const data = await response.json();
                if (data.success) {
                    log('✓ PDF report generated: ' + data.filename, 'success');
                    updateStatus('PDF report ready!', 'status-complete');
                    
                    // Download the PDF
                    window.open('/api/download-pdf?file=' + encodeURIComponent(data.filename), '_blank');
                } else {
                    log('✗ PDF generation failed: ' + data.error, 'error');
                }
            } catch (error) {
                log('✗ Error generating PDF: ' + error, 'error');
            }
        }
        
        // Check for existing results on load
        window.onload = async () => {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();
                if (data.results) {
                    document.getElementById('pdfBtn').disabled = false;
                    log('Previous scan results available', 'success');
                }
            } catch (error) {}
        };
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/save-config', methods=['POST'])
def save_config():
    data = request.json
    config_file = "config.json"
    config = {}
    if os.path.exists(config_file):
        with open(config_file, 'r') as f:
            config = json.load(f)
    config['shodan_api_key'] = data.get('shodan_api_key', '')
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    return jsonify({"success": True})

@app.route('/api/start-scan', methods=['POST'])
def start_scan():
    global current_scan
    
    if current_scan["running"]:
        return jsonify({"error": "Scan already running"}), 400
    
    data = request.json
    targets = data.get('targets', [])
    
    current_scan = {
        "running": True,
        "progress": "",
        "logs": [],
        "results": None,
        "scanner": None
    }
    
    def log_callback(message):
        current_scan["logs"].append(message)
    
    def run_scan():
        try:
            scanner = OsintScanner(
                enable_subdomains=data.get('subdomains', True),
                enable_emails=data.get('emails', True),
                enable_company=data.get('company', True),
                enable_social=data.get('social', True),
                log_callback=log_callback
            )
            
            current_scan["scanner"] = scanner
            results = {}
            
            for i, target in enumerate(targets, 1):
                if not current_scan["running"]:
                    break
                log_callback(f"\n[{i}/{len(targets)}] Scanning: {target}")
                result = scanner.scan_target(target)
                results[target] = result
            
            scanner.results = results
            scanner.save_results()
            current_scan["results"] = results
            current_scan["scanner"] = scanner
            
        except Exception as e:
            log_callback(f"ERROR: {str(e)}")
        finally:
            current_scan["running"] = False
    
    thread = threading.Thread(target=run_scan, daemon=True)
    thread.start()
    
    return jsonify({"success": True})

@app.route('/api/stop-scan', methods=['POST'])
def stop_scan():
    global current_scan
    current_scan["running"] = False
    if current_scan["scanner"]:
        current_scan["scanner"].stop_flag = True
    return jsonify({"success": True})

@app.route('/api/status')
def get_status():
    global current_scan
    logs = current_scan["logs"].copy()
    current_scan["logs"] = []  # Clear after sending
    
    return jsonify({
        "running": current_scan["running"],
        "progress": current_scan["progress"],
        "logs": logs,
        "results": current_scan["results"] is not None
    })

@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    global current_scan
    
    if not current_scan["results"]:
        return jsonify({"success": False, "error": "No scan results available"})
    
    try:
        generator = ProfessionalReportGenerator(current_scan["results"])
        filename = generator.generate()
        return jsonify({"success": True, "filename": os.path.basename(filename)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/download-pdf')
def download_pdf():
    filename = request.args.get('file')
    filepath = os.path.join('output', filename)
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True)
    return "File not found", 404

def main():
    print("=" * 60)
    print("🔍  Professional OSINT Tool - Web GUI")
    print("=" * 60)
    print()
    print("Starting web server...")
    print("Access the application at: http://localhost:5001")
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5001, debug=False)

if __name__ == '__main__':
    main()
