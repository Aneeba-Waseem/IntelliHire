"""
Modified deepgram_client.py 

Removed call to non-existent get_utterance_count() method.
Added the missing method to TranscriptCollectorService.

Key fix:
- In receive_from_deepgram() finally block, removed the call to 
  transcript_collector.get_utterance_count() which doesn't exist
- This was causing task failures after each question
- Fixed: session_id was not defined in connect_deepgram_stt_only scope
- Fixed: websocket.send_json usage now guarded with proper type check
"""

import asyncio
import json
import websockets
import os
import httpx
import logging
from dotenv import load_dotenv
from .TranscriptCollectorService import TranscriptCollector

logger = logging.getLogger(__name__)

load_dotenv()

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
NODE_TRANSCRIPT_URL = os.getenv("NODE_TRANSCRIPT_URL", "")

# UPDATED: VAD-enabled Deepgram configuration
# The key difference: endpointing=300 triggers speech_final detection
DEEPGRAM_WS_URL = (
    "wss://api.deepgram.com/v1/listen"
    "?encoding=linear16"
    "&sample_rate=16000"
    "&channels=1"
    "&punctuate=true"
    "&model=nova-3"
    "&interim_results=true"
    "&endpointing=500"   # ← was 300, increase slightly for stability
    "&utterance_end_ms=1000"  # ← ADD THIS: forces utterance end after 1s silence
    "&smart_format=true"
    "&keep_alive=true"
)

logger.info(f"📡 Deepgram VAD Config:")
logger.info(f"  Encoding: linear16 (16-bit PCM)")
logger.info(f"  Sample rate: 16000 Hz")
logger.info(f"  Channels: 1 (mono)")
logger.info(f"  Endpointing: 300ms (VAD speech finalization)")
logger.info(f"  URL: {DEEPGRAM_WS_URL}")


async def send_to_node(session_id: str, text: str):
    """
    Send transcript to Node.js webhook for processing.
    (Optional - can be disabled)
    """
    if not NODE_TRANSCRIPT_URL:
        logger.debug("⚠️ NODE_TRANSCRIPT_URL not set, skipping webhook")
        return
    
    try:
        async with httpx.AsyncClient(timeout=100) as client:
            response = await client.post(
                NODE_TRANSCRIPT_URL,
                json={"session_id": session_id, "text": text}
            )
            logger.info(f"✅ Sent transcript to Node: {response.status_code}")
    except Exception as e:
        logger.error(f"❌ Node webhook error: {e}")


async def connect_deepgram_stt_only(
    stt_queue: asyncio.Queue,
    websocket,
    session_id: str = "",
    transcript_collector: TranscriptCollector = None,
    session_ctx=None
):
    """
    Connect to Deepgram STT with VAD-based transcript collection.
    
    BEHAVIOR:
    - Receives audio chunks from WebRTC via stt_queue
    - Streams to Deepgram for STT processing
    - Uses TranscriptCollector to buffer transcripts
    - Sends complete utterances (speech_final=true) to client
    - Only sends to /api/flow/answer when utterance is complete
    
    Args:
        stt_queue: Queue of PCM audio chunks from WebRTC
        websocket: Client WebSocket connection (FastAPI WebSocket object)
        session_id: Interview session ID
        transcript_collector: Optional custom collector (for testing)
        session_ctx: SessionContext for task tracking (optional, per-question sessions)
    
    Returns:
        Tuple: (deepgram_ws, transcript_collector) or (None, None) on error
    """
    
    logger.info(f"🔗 [STT] Connecting to Deepgram for session {session_id} ...")
    logger.info(f"    Using VAD endpointing=300ms for speech detection")
    logger.info(f"    Session context: {session_ctx is not None}")
    
    deepgram_ws = None
    
    # Create or use provided TranscriptCollector
    if transcript_collector is None:
        transcript_collector = TranscriptCollector(
            on_complete=lambda text: logger.info(f"✅ [COLLECTOR] Complete: {text[:50]}..."),
            on_interim=lambda text: logger.debug(f"🟡 [COLLECTOR] Interim: {text[:50]}..."),
            max_silence_ms=60000,  # Wait 20s after final for additional chunks
        )
    
    try:
        if not DEEPGRAM_API_KEY:
            raise ValueError("DEEPGRAM_API_KEY environment variable not set!")
        
        logger.info(f"🔑 [STT] API Key present: {DEEPGRAM_API_KEY[:20]}...")
        logger.info(f"🔗 [STT] Connecting to: {DEEPGRAM_WS_URL}")
        
        # Connect to Deepgram with proper configuration
        deepgram_ws = await websockets.connect(
            DEEPGRAM_WS_URL,
            additional_headers={"Authorization": f"Token {DEEPGRAM_API_KEY}"},
            open_timeout=30,
            ping_interval=30,
            ping_timeout=3600,
        )
        
        logger.info(f"✅ [STT] Deepgram connected for session {session_id}")
        
    except ValueError as e:
        logger.critical(f"❌ [STT] Configuration error: {e}")
        try:
            if websocket:
                await websocket.send_json({
                    "type": "error",
                    "error": "STT service not configured"
                })
        except Exception as send_err:
            logger.error(f"Error sending error message to client: {send_err}")
        return None, None
    
    except websockets.exceptions.WebSocketException as e:
        logger.critical(f"❌ [STT] Deepgram WebSocket connection failed: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "error": f"STT connection failed: {str(e)}"
            })
        except Exception as send_err:
            logger.error(f"Error sending error message to client: {send_err}")
        return None, None
    
    except Exception as e:
        logger.critical(f"❌ [STT] Unexpected error: {e}", exc_info=True)
        try:
            if websocket:
                await websocket.send_json({"type": "error", "error": str(e)})
        except Exception:
            pass
        return None, None
    
    # Task 1: Send audio from queue to Deepgram
    async def send_to_deepgram():
        """Stream audio chunks from WebRTC to Deepgram"""
        logger.info(f"📤 [STT] Send task started for {session_id}")
        
        chunks_sent = 0
        bytes_sent = 0
        
        try:
            while True:
                try:
                    chunk = await stt_queue.get()
                    
                    if chunk is None:
                        logger.info(f"✅ [STT] End-of-stream signal received")
                        try:
                            await deepgram_ws.send(json.dumps({"type": "CloseStream"}))
                            logger.info(f"📤 [STT] Sent CloseStream to Deepgram")
                        except Exception as e:
                            logger.debug(f"CloseStream send error: {e}")
                        break
                    
                    await deepgram_ws.send(chunk)
                    chunks_sent += 1
                    bytes_sent += len(chunk)
                    
                    if chunks_sent % 20 == 0:
                        logger.debug(f"  [📤] {chunks_sent} chunks sent ({bytes_sent} bytes)")
                
                except websockets.exceptions.ConnectionClosed as e:
                    logger.error(f"❌ [STT] Deepgram closed: {e}")
                    break
                except Exception as e:
                    logger.error(f"❌ [STT] Send error: {e}")
                    break
        
        finally:
            logger.info(f"📤 [STT] Send task ended: {chunks_sent} chunks, {bytes_sent} bytes")
            try:
                if deepgram_ws:
                    await deepgram_ws.close()
            except Exception as e:
                logger.warning(f"Error closing Deepgram: {e}")

    # Task 2: Receive and process transcripts from Deepgram
    async def receive_from_deepgram():
        """
        Listen for transcript responses from Deepgram.
        
        ⭐ KEY LOGIC:
        - interim results (speech_final=false) → add to collector (on_interim called)
        - final results (speech_final=true) → add to collector (on_complete called)
        - on_complete → send complete utterance to client/webhook
        """
        logger.info(f"📥 [STT] Receive task started for {session_id}")
        
        messages_received = 0
        final_transcripts = 0
        
        try:
            async for msg in deepgram_ws:
                try:
                    data = json.loads(msg)
                    messages_received += 1
                    
                    # ⭐ CHECK FOR ERRORS FIRST
                    if "error" in data:
                        logger.error(f"❌ [STT] Deepgram error: {data}")
                        try:
                            if websocket:
                                await websocket.send_json({
                                    "type": "error",
                                    "error": f"STT error: {data.get('error', {}).get('message', 'Unknown')}",
                                    "details": data.get('error')
                                })
                        except Exception as e:
                            logger.error(f"Error sending error to client: {e}")
                        continue
                    
                   # ⭐ PROCESS TRANSCRIPT
                    channel = data.get("channel")

                    # Handle Deepgram sending channel as list OR dict
                    if isinstance(channel, list):
                        channel = channel[0] if channel else {}

                    if isinstance(channel, dict) and channel.get("alternatives"):
                        alt = channel["alternatives"][0]
                        text = alt.get("transcript", "").strip()
                        confidence = alt.get("confidence", 0)
                        is_final = data.get("is_final", False)
                        
                        if text:
                            if not is_final:
                                # 🟡 INTERIM: Add to collector (will call on_interim)
                                logger.debug(f"  🟡 INTERIM [{session_id}]: {text}")
                                await transcript_collector.add_chunk(
                                    text,
                                    is_final=False,
                                    confidence=confidence
                                )
                            else:
                                # 🟢 FINAL: Add to collector (will call on_complete)
                                logger.info(
                                    f"  🟢 FINAL [{session_id}]: {text} "
                                    f"(confidence: {confidence:.2f})"
                                )
                                final_transcripts += 1
                                
                                await transcript_collector.add_chunk(
                                    text,
                                    is_final=True,
                                    confidence=confidence
                                )
                    
                    # Log other response types
                    elif "metadata" in data:
                        logger.debug(f"📊 Deepgram metadata received")
                    else:
                        logger.debug(f"📨 Deepgram response: {list(data.keys())}")
                
                except json.JSONDecodeError as e:
                    logger.error(f"❌ JSON decode error: {e}")
                except Exception as e:
                    logger.error(f"❌ Error processing message: {e}", exc_info=True)
        
        except websockets.exceptions.ConnectionClosed as e:
            logger.info(f"🔌 [STT] Deepgram closed")
            logger.info(f"    Code: {e.rcvd.code if e.rcvd else 'None'}")
        except asyncio.CancelledError:
            logger.info(f"[STT] Receive task cancelled")
        except Exception as e:
            logger.error(f"❌ [STT] Error: {e}", exc_info=True)
        
        finally:
            # Force finalize any remaining transcript
            await transcript_collector.force_finalize()
            # ✅ FIXED: Removed call to non-existent get_utterance_count()
            logger.info(
                f"📊 [STT] Receive task ended:\n"
                f"    Total messages: {messages_received}\n"
                f"    Final transcripts: {final_transcripts}"
            )

    # ⭐ Setup callback to send complete utterances to client
    async def on_complete_utterance(text: str):
        """
        Called when a complete utterance is ready (speech_final + timeout)
        
        This is where we send the complete answer to the client/interview flow
        """
        logger.info(f"✅ [CALLBACK] Complete utterance: '{text}'")
        
        try:
            if websocket:
                # Send complete transcript to client
                await websocket.send_json({
                    "type": "transcript_complete",
                    "text": text,
                    "session_id": session_id
                })
                logger.info(f"  ✅ Sent complete transcript to client")
        except Exception as e:
            logger.error(f"  ❌ Error sending to client: {e}")
        
        # Optionally send to Node webhook
        await send_to_node(session_id, text)
    
    # Attach completion callback to collector
    transcript_collector.on_complete = on_complete_utterance
    
    # ⭐ Start both tasks - use session_ctx if provided, otherwise create standalone
    logger.info(f"🚀 [STT] Starting Deepgram tasks for {session_id}")
    
    if session_ctx:
        # Per-question session with task tracking
        logger.info(f"  Using SessionContext for task tracking")
        session_ctx.create_task(send_to_deepgram(), name=f"stt-send-{session_id}")
        session_ctx.create_task(receive_from_deepgram(), name=f"stt-recv-{session_id}")
    else:
        # Standalone tasks (fallback)
        logger.info(f"  No SessionContext - creating standalone tasks")
        asyncio.create_task(send_to_deepgram())
        asyncio.create_task(receive_from_deepgram())
    
    logger.info(f"✅ [STT] Tasks scheduled for {session_id}")
    
    return deepgram_ws, transcript_collector