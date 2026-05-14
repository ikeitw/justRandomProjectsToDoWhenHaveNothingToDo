#!/usr/bin/env python3
"""
F1 Dashboard - Quick Setup & Runner
Run this script to verify dependencies and start the server
"""

import sys
import subprocess
import platform
from pathlib import Path

def check_python_version():
    """Verify Python 3.11+"""
    if sys.version_info < (3, 11):
        print("❌ Python 3.11+ required")
        print(f"   Current version: {sys.version}")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}")

def install_dependencies():
    """Install required packages"""
    print("\n📦 Installing dependencies...")
    req_file = Path(__file__).parent / "requirements.txt"

    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", str(req_file)
        ])
        print("✅ Dependencies installed")
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        sys.exit(1)

def start_server():
    """Start the FastAPI server"""
    print("\n🚀 Starting F1 Dashboard Server...")
    print("=" * 60)
    print("📍 Dashboard: http://localhost:8000")
    print("📡 WebSocket: ws://localhost:8000/ws")
    print("📊 API Debug: http://localhost:8000/docs")
    print("=" * 60)
    print("\nPress Ctrl+C to stop the server\n")

    backend_dir = Path(__file__).parent / "backend"
    main_file = backend_dir / "main.py"

    try:
        subprocess.run([sys.executable, str(main_file)])
    except KeyboardInterrupt:
        print("\n\n👋 Dashboard stopped")
        sys.exit(0)

def main():
    print("=" * 60)
    print("  F1 LIVE TIMING DASHBOARD")
    print("=" * 60)

    check_python_version()
    install_dependencies()
    start_server()

if __name__ == "__main__":
    main()

