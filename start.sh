#!/bin/bash
# Start the Ecommerce Agent API
cd "$(dirname "$0")"
python3 -m venv .venv 2>/dev/null
source .venv/bin/activate
pip install -q -r api/requirements.txt 2>/dev/null
python3 run.py
