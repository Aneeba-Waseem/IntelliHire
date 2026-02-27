# import os
# from pathlib import Path
# from dotenv import load_dotenv

# # ---- Load .env explicitly ----
# BASE_DIR = Path(__file__).resolve().parent
# ENV_PATH = BASE_DIR / ".env"
# load_dotenv(dotenv_path=ENV_PATH)
# print("ENV_PATH exists?", ENV_PATH.exists())

# # ---- Environment variables ----
# HF_API_KEY = os.getenv("HF_API_KEY")
# HF_MODEL = os.getenv("HF_MODEL")

# HF_API_URL = f"https://router.huggingface.co/hf-inference/models/{HF_MODEL}"

# REQUEST_TIMEOUT = float(os.getenv("HF_TIMEOUT", "30"))
# MAX_RETRIES = int(os.getenv("HF_MAX_RETRIES", "2"))

# if not HF_API_KEY:
#     raise RuntimeError("HF_API_KEY not set")

# if not HF_MODEL:
#     raise RuntimeError("HF_MODEL not set")

import os
from pathlib import Path
from dotenv import load_dotenv

# ---- Load .env explicitly ----
BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"

print(f"[INFO] Loading .env from: {ENV_PATH}")
if not ENV_PATH.exists():
    raise FileNotFoundError(f".env file not found at {ENV_PATH}")

load_dotenv(dotenv_path=ENV_PATH)

# ---- Environment variables ----
HF_API_KEY = os.getenv("HF_API_KEY")
HF_MODEL = os.getenv("HF_MODEL")
HF_TIMEOUT = os.getenv("HF_TIMEOUT", "30")
HF_MAX_RETRIES = os.getenv("HF_MAX_RETRIES", "2")

print(f"[DEBUG] HF_API_KEY set: {'Yes' if HF_API_KEY else 'No'}")
print(f"[DEBUG] HF_MODEL set: {HF_MODEL}")
print(f"[DEBUG] HF_TIMEOUT set: {HF_TIMEOUT}")
print(f"[DEBUG] HF_MAX_RETRIES set: {HF_MAX_RETRIES}")

# ---- Validation ----
if not HF_API_KEY:
    raise RuntimeError("HF_API_KEY not set. Please check your .env")
if not HF_MODEL:
    raise RuntimeError("HF_MODEL not set. Please check your .env")

# ---- Convert to proper types ----
try:
    REQUEST_TIMEOUT = float(HF_TIMEOUT)
except ValueError:
    print(f"[WARNING] Invalid HF_TIMEOUT value '{HF_TIMEOUT}', using default 30s")
    REQUEST_TIMEOUT = 30.0

try:
    MAX_RETRIES = int(HF_MAX_RETRIES)
except ValueError:
    print(f"[WARNING] Invalid HF_MAX_RETRIES value '{HF_MAX_RETRIES}', using default 2")
    MAX_RETRIES = 2

# ---- HF API URL ----
HF_API_URL = f"https://router.huggingface.co/v1"
print(f"[INFO] HF_API_URL: {HF_API_URL}")

# ---- Test connectivity (optional) ----
if __name__ == "__main__":
    import requests

    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    try:
        print(f"[INFO] Testing Hugging Face model endpoint...")
        resp = requests.get(HF_API_URL, headers=headers, timeout=REQUEST_TIMEOUT)
        print(f"[INFO] Response status code: {resp.status_code}")
        if resp.status_code == 200:
            print("[SUCCESS] API key and model are valid!")
        else:
            print(f"[ERROR] API returned {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[ERROR] Could not reach Hugging Face API: {e}")
