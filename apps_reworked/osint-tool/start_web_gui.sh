#!/bin/bash

# Start Web-Based OSINT GUI

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
VENV_PATH="$SCRIPT_DIR/.venv"

echo "🔍 Professional OSINT Tool - Web GUI"
echo "====================================="

# Activate venv
if [ -d "$VENV_PATH" ]; then
    source "$VENV_PATH/bin/activate"
else
    echo "❌ Virtual environment not found!"
    echo "Run: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Install/upgrade dependencies
echo "📦 Installing dependencies..."
pip install --quiet -r "$SCRIPT_DIR/requirements.txt"

# Start web server
echo ""
echo "🚀 Starting web server..."
echo "🌐 Open your browser to: http://localhost:5000"
echo ""
python "$SCRIPT_DIR/osint_web_gui.py"
