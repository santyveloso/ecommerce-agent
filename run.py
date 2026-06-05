#!/usr/bin/env python3
"""Run the Ecommerce Agent API server."""

import sys
from pathlib import Path

# Add api dir to path
api_dir = Path(__file__).parent / "api"
sys.path.insert(0, str(api_dir))

import uvicorn
from app.main import app

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=7777,
        reload=True,
    )
