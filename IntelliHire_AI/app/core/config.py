import os
from pathlib import Path
from dotenv import load_dotenv

# Get project root/app directory
BASE_DIR = Path(__file__).resolve().parents[1]   # points to app/
ENV_PATH = BASE_DIR / ".env"

# Load .env explicitly
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
    print(f"[CONFIG] Loaded .env from {ENV_PATH}")
else:
    print(f"[CONFIG WARNING] .env not found at {ENV_PATH}")

# -------- Variables --------
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "fugSRYLwCEjXVKA8lbpP") 

NODE_TRANSCRIPT_WEBHOOK = os.getenv("NODE_TRANSCRIPT_WEBHOOK", "")
NODE_WEBHOOK_TOKEN = os.getenv("NODE_WEBHOOK_TOKEN", "")

SAMPLE_RATE = int(os.getenv("AUDIO_SAMPLE_RATE", "22050"))
CHANNELS = int(os.getenv("AUDIO_CHANNELS", "1"))

NODE_TRANSCRIPT_URL = os.getenv("NODE_TRANSCRIPT_URL")
VOICE_ID = os.getenv("VOICE_ID", "9J08XLaVNO9dwqz7kWR7")