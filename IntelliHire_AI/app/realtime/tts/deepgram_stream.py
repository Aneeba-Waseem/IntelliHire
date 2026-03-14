import os
import json
import base64
import logging
import aiohttp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure these are set in your config
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
DEEPGRAM_TTS_MODEL = os.getenv("DEEPGRAM_TTS_MODEL", "aura-asteria-en")  # Default to Aura-2 if not set

async def deepgram_pcm_stream(text: str):
    if not DEEPGRAM_API_KEY:
        raise RuntimeError("DEEPGRAM_API_KEY not set")

    url = f"https://api.deepgram.com/v1/speak?model={DEEPGRAM_TTS_MODEL}&encoding=linear16&sample_rate=48000"
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {"text": text}

    logger.info(f"Connecting to Deepgram TTS with model {DEEPGRAM_TTS_MODEL}...")
    logger.info(f"Exact text: {text}")

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=payload) as response:
            if response.status != 200:
                error = await response.text()
                raise RuntimeError(f"Deepgram TTS error: {error}")

            buffer = b""
            MIN_CHUNK_SIZE = 960*2  

            async for chunk, _ in response.content.iter_chunks():
                logger.info(f"Received PCM chunk: {len(chunk)} bytes")
                buffer += chunk
                if len(buffer) >= MIN_CHUNK_SIZE:
                    yield buffer
                    buffer = b""

            if buffer:  # Yield any remaining data
                yield buffer
