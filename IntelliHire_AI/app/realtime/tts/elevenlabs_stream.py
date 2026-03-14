import os
import json
import base64
import websockets
from ...core.config import ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def elevenlabs_pcm_stream(text: str):
    if not ELEVENLABS_API_KEY:
        raise RuntimeError("ELEVENLABS_API_KEY not set")
    logger.info(f"Connecting to ElevenLabs TTS stream with voice ID {ELEVENLABS_VOICE_ID}...")
    url = (
        f"wss://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}/stream-input"
        f"?model_id=eleven_multilingual_v2"
        f"&output_format=pcm_24000"
    )
    headers = {"xi-api-key": ELEVENLABS_API_KEY}

    async with websockets.connect(url, additional_headers=headers) as ws:
        logger.info(f"Exact text: {text}")
        await ws.send(json.dumps({
            "text": text,
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
        }))
        await ws.send(json.dumps({"text": ""}))

        buffer = b""
        MIN_CHUNK_SIZE = 12000
      
        async for msg in ws:
            data = json.loads(msg)
            logger.info(f"Received chunk: {len(data.get('audio', ''))} bytes, isFinal={data.get('isFinal', False)}")
            if "audio" in data and data["audio"]:
                audio_bytes = base64.b64decode(data["audio"])
                buffer += audio_bytes
                if len(buffer) >= MIN_CHUNK_SIZE:
                    yield buffer
                    buffer = b""
            if data.get("isFinal"):
                break
        if buffer:
            yield buffer