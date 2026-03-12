#!/bin/bash

# Professional OSINT Tool - GUI Launcher

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
VENV_PATH="$SCRIPT_DIR/.venv"

echo "🔍 Professional OSINT Tool - GUI"
echo "================================="

# Check if venv exists
if [ ! -d "$VENV_PATH" ]; then
    echo "❌ Virtual environment not found"
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_PATH"
fi

# Activate venv
echo "🔧 Activating virtual environment..."
source "$VENV_PATH/bin/activate"

# Install/upgrade dependencies
echo "📦 Installing dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r "$SCRIPT_DIR/requirements.txt"

# Suppress SSL warnings
export PYTHONWARNINGS="ignore:Unverified HTTPS request"

# Launch GUI
echo "🚀 Launching GUI application..."
echo ""
python "$SCRIPT_DIR/osint_gui.py"
