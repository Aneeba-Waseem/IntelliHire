import os
import json
import logging
import aiohttp
from fastapi import WebSocket

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
DEEPGRAM_TTS_MODEL = os.getenv("DEEPGRAM_TTS_MODEL", "aura-asteria-en")

async def deepgram_pcm_stream(text: str, websocket=None):
    """Stream TTS audio from Deepgram with sample rate logging."""
    
    if not DEEPGRAM_API_KEY:
        raise RuntimeError("DEEPGRAM_API_KEY not set")
    
    # ⭐ CRITICAL: Request 48kHz explicitly
    url = f"https://api.deepgram.com/v1/speak?model={DEEPGRAM_TTS_MODEL}&encoding=linear16&sample_rate=48000"
    
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {"text": text}
    
    logger.info(f"🌐 Deepgram TTS Request:")
    logger.info(f"  Model: {DEEPGRAM_TTS_MODEL}")
    logger.info(f"  Encoding: linear16 (PCM 16-bit)")
    logger.info(f"  Sample rate: 48000 Hz")
    logger.info(f"  Text: {text[:50]}...")
    
    total_bytes = 0
    chunk_count = 0
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=payload) as response:
            if response.status != 200:
                error = await response.text()
                logger.error(f"❌ Deepgram error: {response.status}")
                logger.error(f"   {error}")
                raise RuntimeError(f"Deepgram TTS error: {error}")
            
            # Check response headers for content info
            content_type = response.headers.get('Content-Type', 'unknown')
            content_length = response.headers.get('Content-Length', 'unknown')
            
            logger.info(f"📡 Deepgram Response:")
            logger.info(f"  Content-Type: {content_type}")
            logger.info(f"  Content-Length: {content_length}")
            
            # Stream audio chunks
            MIN_CHUNK_SIZE = 960 * 2  # 960 samples * 2 bytes per sample = 1920 bytes
            buffer = b""
            first_chunk_sent = False
            
            async for chunk, _ in response.content.iter_chunks():
                chunk_count += 1
                total_bytes += len(chunk)
                buffer += chunk
                
                logger.debug(f"📦 Chunk {chunk_count}: {len(chunk)} bytes (total: {total_bytes})")
                
                if len(buffer) >= MIN_CHUNK_SIZE:
                    # ⭐ SEND "speaking" MESSAGE ON FIRST YIELD
                    if not first_chunk_sent and websocket:
                        try:
                            await websocket.send_json({
                                "type": "speaking",
                                "text": text
                            })
                            logger.info(f"📨 Sent 'speaking' message to frontend: {text[:50]}...")
                            first_chunk_sent = True
                        except Exception as e:
                            logger.warning(f"⚠️ Failed to send speaking message: {e}")
                    
                    logger.info(f"📤 Yielding {len(buffer)} bytes ({len(buffer)//2} samples)")
                    yield buffer
                    buffer = b""
            
           # Yield remaining data
            if buffer:
                # ⭐ SEND "speaking" MESSAGE IF NOT SENT YET (for very short responses)
                if not first_chunk_sent and websocket:
                    try:
                        await websocket.send_json({
                            "type": "speaking",
                            "text": text
                        })
                        logger.info(f"📨 Sent 'speaking' message to frontend: {text[:50]}...")
                        first_chunk_sent = True
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to send speaking message: {e}")
                
                logger.info(f"📤 Yielding final {len(buffer)} bytes ({len(buffer)//2} samples)")
                yield buffer
    
    logger.info(f"✅ Deepgram stream complete:")
    logger.info(f"  Total chunks: {chunk_count}")
    logger.info(f"  Total bytes: {total_bytes}")
    logger.info(f"  Total samples: {total_bytes // 2}")
    logger.info(f"  Duration at 48kHz: {(total_bytes // 2) / 48000:.2f}s")


# ⭐ Optional: Test function
async def test_deepgram():
    """Test Deepgram TTS and verify audio properties."""
    import asyncio
    
    text = "Hello, this is a test of Deepgram TTS with proper audio settings."
    
    logger.info("\n" + "="*70)
    logger.info("DEEPGRAM TTS AUDIO TEST")
    logger.info("="*70)
    
    try:
        total_samples = 0
        async for pcm in deepgram_pcm_stream(text):
            samples = len(pcm) // 2  # 2 bytes per sample
            total_samples += samples
            logger.info(f"  Received {samples} samples ({len(pcm)} bytes)")
        
        duration = total_samples / 48000
        logger.info(f"\n✅ Test Complete:")
        logger.info(f"  Total samples: {total_samples}")
        logger.info(f"  Duration: {duration:.2f}s")
        logger.info(f"  Sample rate: 48000 Hz")
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_deepgram())