import os
from pathlib import Path
from dotenv import load_dotenv

# =====================================================
# Locate root .env (app/.env)
# =====================================================

# settings.py → config → evaluator → app
BASE_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = BASE_DIR / ".env"

print(f"[INFO] Loading .env from: {ENV_PATH}")

# Load only if exists (no crash if already loaded by main)
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    print("[WARNING] .env not found, relying on system environment variables")

# =====================================================
# Environment variables
# =====================================================

HF_API_KEY = os.getenv("HF_API_KEY")
HF_MODEL = os.getenv("HF_MODEL")
HF_TIMEOUT = os.getenv("HF_TIMEOUT", "30")
HF_MAX_RETRIES = os.getenv("HF_MAX_RETRIES", "2")

print(f"[DEBUG] HF_API_KEY set: {'Yes' if HF_API_KEY else 'No'}")
print(f"[DEBUG] HF_MODEL: {HF_MODEL}")

# =====================================================
# Validation
# =====================================================

if not HF_API_KEY:
    raise RuntimeError("HF_API_KEY not set. Check app/.env")

if not HF_MODEL:
    raise RuntimeError("HF_MODEL not set. Check app/.env")

# =====================================================
# Type conversions
# =====================================================

try:
    REQUEST_TIMEOUT = float(HF_TIMEOUT)
except ValueError:
    REQUEST_TIMEOUT = 30.0

try:
    MAX_RETRIES = int(HF_MAX_RETRIES)
except ValueError:
    MAX_RETRIES = 2

# =====================================================
# HF API URL
# =====================================================

HF_API_URL = "https://router.huggingface.co/v1"