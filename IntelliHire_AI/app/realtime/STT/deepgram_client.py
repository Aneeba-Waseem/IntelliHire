import asyncio
import json
import websockets
import os
import httpx
import numpy as np
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
NODE_TRANSCRIPT_URL = os.getenv("NODE_TRANSCRIPT_URL", "")

# ⭐ CRITICAL: Deepgram STT expects 16kHz mono linear16 PCM
DEEPGRAM_WS_URL = (
    "wss://api.deepgram.com/v1/listen"
    "?encoding=linear16"
    "&sample_rate=16000"
    "&channels=1"
    "&interim_results=true"
    "&punctuate=true"
    "&model=nova-3"
)

logger.info(f"📡 Deepgram STT Config:")
logger.info(f"  Encoding: linear16 (16-bit PCM)")
logger.info(f"  Sample rate: 16000 Hz")
logger.info(f"  Channels: 1 (mono)")
logger.info(f"  URL: {DEEPGRAM_WS_URL}")


def generate_silence(duration_sec=0.5, sample_rate=16000):
    """
    Generate linear16 PCM silence bytes for Deepgram keep-alive.
    
    Args:
        duration_sec: Duration of silence in seconds
        sample_rate: Sample rate in Hz (default 16000)
    
    Returns:
        bytes: PCM silence
    """
    num_samples = int(duration_sec * sample_rate)
    silence = np.zeros(num_samples, dtype=np.int16)
    logger.debug(f"🔇 Generated {num_samples} silence samples ({len(silence.tobytes())} bytes)")
    return silence.tobytes()


async def send_to_node(session_id: str, text: str):
    """
    Send transcript to Node.js webhook for processing.
    """
    if not NODE_TRANSCRIPT_URL:
        logger.debug("⚠️ NODE_TRANSCRIPT_URL not set, skipping webhook")
        return
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                NODE_TRANSCRIPT_URL,
                json={"session_id": session_id, "text": text}
            )
            logger.info(f"✅ Sent transcript to Node: {response.status_code}")
    except Exception as e:
        logger.error(f"❌ Node webhook error: {e}")


async def connect_deepgram(stt_queue: asyncio.Queue, websocket, session_id: str):
    """
    Connect to Deepgram STT, stream audio from queue, handle responses.
    
    This maintains a bidirectional WebSocket connection:
    - SEND: Audio chunks from the STT queue (48kHz → 16kHz resampled)
    - RECEIVE: Transcript responses from Deepgram
    
    ⭐ CRITICAL: This function spawns two background tasks!
    """
    
    logger.info(f"🔗 [STT] Connecting to Deepgram for session {session_id}...")
    
    deepgram_ws = None
    try:
        # Verify API key exists
        if not DEEPGRAM_API_KEY:
            raise ValueError("DEEPGRAM_API_KEY environment variable not set!")
        
        # Connect to Deepgram with proper error handling
        deepgram_ws = await websockets.connect(
            DEEPGRAM_WS_URL,
            additional_headers={"Authorization": f"Token {DEEPGRAM_API_KEY}"},
            open_timeout=10,
        )
        logger.info(f"✅ [STT] Deepgram WebSocket connected for session {session_id}")
        
    except ValueError as e:
        logger.critical(f"❌ [STT] Configuration error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "error": "STT service not configured"
            })
        except Exception as send_err:
            logger.error(f"Error sending error message to client: {send_err}")
        return None
    
    except websockets.exceptions.WebSocketException as e:
        logger.critical(f"❌ [STT] Deepgram WebSocket connection failed: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "error": f"STT connection failed: {str(e)}"
            })
        except Exception as send_err:
            logger.error(f"Error sending error message to client: {send_err}")
        return None
    
    except Exception as e:
        logger.critical(f"❌ [STT] Unexpected error connecting to Deepgram: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "type": "error",
                "error": f"STT error: {str(e)}"
            })
        except Exception as send_err:
            logger.error(f"Error sending error message to client: {send_err}")
        return None

    # Task 1: Send audio to Deepgram
    async def send_to_deepgram():
        """
        Read audio chunks from queue and send to Deepgram.
        Maintains keep-alive by sending silence if queue is empty.
        """
        logger.info(f"📤 [STT] Send task started for {session_id}")
        
        last_audio_time = asyncio.get_event_loop().time()
        keep_alive_interval = 2.0  # Send silence every 2 seconds if no audio
        chunks_sent = 0
        bytes_sent = 0
        
        try:
            while True:
                try:
                    # Wait for audio chunk with timeout
                    chunk = await asyncio.wait_for(stt_queue.get(), timeout=1.0)
                    
                    # None signals end of stream
                    if chunk is None:
                        logger.info(f"✅ [STT] End-of-stream signal received for {session_id}")
                        break
                    
                    # Send audio to Deepgram
                    await deepgram_ws.send(chunk)
                    chunks_sent += 1
                    bytes_sent += len(chunk)
                    last_audio_time = asyncio.get_event_loop().time()
                    
                    logger.debug(f"  📤 Chunk {chunks_sent}: {len(chunk)} bytes sent to Deepgram")
                
                except asyncio.TimeoutError:
                    # No audio in queue - send silence to keep connection alive
                    current_time = asyncio.get_event_loop().time()
                    if current_time - last_audio_time > keep_alive_interval:
                        silence = generate_silence(duration_sec=0.5, sample_rate=16000)
                        try:
                            await deepgram_ws.send(silence)
                            logger.debug(f"🔇 Keep-alive silence sent ({len(silence)} bytes)")
                            last_audio_time = current_time
                        except websockets.exceptions.ConnectionClosed:
                            logger.warning(f"⚠️ [STT] Connection closed while sending keep-alive")
                            break
                
                except websockets.exceptions.ConnectionClosed:
                    logger.warning(f"⚠️ [STT] Deepgram connection closed during send")
                    break
                
                except Exception as e:
                    logger.error(f"❌ [STT] Error in send_to_deepgram: {e}", exc_info=True)
                    break
        
        finally:
            logger.info(f"🎤 [STT] Send task ended. Chunks: {chunks_sent}, Bytes: {bytes_sent}")
            try:
                if deepgram_ws:
                    await deepgram_ws.close()
                    logger.info(f"🔌 [STT] Deepgram WebSocket closed for {session_id}")
            except Exception as e:
                logger.warning(f"Error closing Deepgram WebSocket: {e}")

    # Task 2: Receive transcripts from Deepgram
    async def receive_from_deepgram():
        """
        Listen for transcript responses from Deepgram.
        Sends final transcripts back to client and webhook.
        """
        logger.info(f"📥 [STT] Receive task started for {session_id}")
        
        interim_buffer = ""
        transcripts_received = 0
        final_transcripts = 0
        
        try:
            async for msg in deepgram_ws:
                try:
                    data = json.loads(msg)
                    transcripts_received += 1
                    
                    # Check if we have transcript data
                    if "channel" in data and data["channel"].get("alternatives"):
                        alt = data["channel"]["alternatives"][0]
                        text = alt.get("transcript", "").strip()
                        confidence = alt.get("confidence", 0)
                        
                        # Log interim results
                        if not data.get("is_final"):
                            logger.debug(f"  🟡 INTERIM [{session_id}]: {text}")
                            interim_buffer = text
                        
                        # Process final results
                        else:
                            if text:
                                final_transcripts += 1
                                logger.info(f"🟢 [STT] FINAL [{session_id}]: {text} (confidence: {confidence:.2f})")
                                
                                # Send to WebRTC client
                                try:
                                    await websocket.send_json({
                                        "type": "transcript",
                                        "text": text,
                                        "confidence": confidence,
                                        "session_id": session_id
                                    })
                                    logger.debug(f"  ✅ Transcript sent to client")
                                except Exception as e:
                                    logger.error(f"  ❌ Error sending transcript to client: {e}")
                                
                                # Send to Node webhook
                                await send_to_node(session_id, text)
                                
                                # Clear interim buffer
                                interim_buffer = ""
                    
                    # Log metadata responses
                    elif "metadata" in data:
                        logger.debug(f"📊 Deepgram metadata: {data['metadata']}")
                    
                    # Log other response types
                    else:
                        logger.debug(f"📨 Deepgram response: {list(data.keys())}")
                
                except json.JSONDecodeError as e:
                    logger.error(f"❌ JSON decode error in Deepgram response: {e}")
                except Exception as e:
                    logger.error(f"❌ Error processing Deepgram message: {e}", exc_info=True)
        
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"🔌 [STT] Deepgram WebSocket closed during receive")
        except Exception as e:
            logger.error(f"❌ [STT] Error in receive_from_deepgram: {e}", exc_info=True)
        
        finally:
            logger.info(f"📊 [STT] Receive task ended. Received: {transcripts_received}, Final: {final_transcripts}")

    # Start both tasks
    logger.info(f"🚀 [STT] Starting send/receive tasks for {session_id}")
    asyncio.create_task(send_to_deepgram())
    asyncio.create_task(receive_from_deepgram())
    
    logger.info(f"✅ [STT] Deepgram tasks scheduled for {session_id}")
    
    return deepgram_ws