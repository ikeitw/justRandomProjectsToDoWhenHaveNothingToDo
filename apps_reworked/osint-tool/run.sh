#!/bin/bash

# OSINT Tool Runner Script
# Automatically activates venv and runs the tool

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
VENV_PATH="$SCRIPT_DIR/.venv"

echo "🔍 OSINT Tool Launcher"
echo "======================"

# Check if venv exists
if [ ! -d "$VENV_PATH" ]; then
    echo "❌ Virtual environment not found at $VENV_PATH"
    echo "Creating new virtual environment..."
    python3 -m venv "$VENV_PATH"
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment"
        exit 1
    fi
    echo "✅ Virtual environment created"
fi

# Activate venv
echo "🔧 Activating virtual environment..."
source "$VENV_PATH/bin/activate"

# Check if config.json exists, if not copy from example
if [ ! -f "$SCRIPT_DIR/config.json" ]; then
    echo "⚠️  config.json not found"
    if [ -f "$SCRIPT_DIR/config_example.json" ]; then
        echo "📋 Copying config_example.json to config.json..."
        cp "$SCRIPT_DIR/config_example.json" "$SCRIPT_DIR/config.json"
        echo "✅ Config file created (fill API keys if needed)"
    fi
fi

# Check if requirements are installed
echo "📦 Checking dependencies..."
python -c "import requests, whois, dns.resolver, fpdf" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📥 Installing requirements..."
    python -m pip install --upgrade pip setuptools wheel
    python -m pip install -r "$SCRIPT_DIR/requirements.txt"
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        echo "💡 Try manually: source .venv/bin/activate && pip install -r requirements.txt"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Run the tool with all arguments passed to this script
echo ""
echo "🚀 Running OSINT tool..."
echo "========================"
python "$SCRIPT_DIR/osint_main.py" "$@"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ OSINT scan completed successfully!"
    echo "📄 Check the 'output' folder for results"
else
    echo ""
    echo "❌ OSINT scan failed with exit code $EXIT_CODE"
fi

exit $EXIT_CODE
