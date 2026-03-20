import json
import asyncio
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.sdp import candidate_from_sdp
from ..realtime.session_manager import session_manager
from ..realtime.tts.deepgram_stream import deepgram_pcm_stream
from ..realtime.STT.deepgram_client import connect_deepgram
from ..realtime.STT.deepgram_stream import stream_audio
from logging import getLogger

logger = getLogger(__name__)
router = APIRouter()


def is_valid_token(token: str) -> bool:
    """Validate authentication token."""
    return token and len(token) > 10


async def run_tts(text: str, tts_queue: asyncio.Queue):
    """Stream TTS audio into the TTS queue."""
    try:
        logger.info(f"🎙️ [TTS] Starting TTS for text: {text[:50]}...")
        async for pcm in deepgram_pcm_stream(text):
            logger.debug(f"[TTS] PCM chunk: {len(pcm)} bytes")
            try:
                # Put with timeout to avoid blocking indefinitely
                await asyncio.wait_for(tts_queue.put(pcm), timeout=2.0)
            except asyncio.TimeoutError:
                logger.warning("[TTS] Queue full, dropping chunk")
            except asyncio.CancelledError:
                logger.info("[TTS] TTS task cancelled")
                break
            except Exception as e:
                logger.error(f"[TTS] Queue error: {e}")
                break
        logger.info(f"✅ [TTS] Finished streaming TTS")
    except Exception as e:
        logger.error(f"❌ [TTS] Deepgram TTS error: {e}", exc_info=True)


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str = None):
    """
    Main WebRTC + STT/TTS WebSocket endpoint.
    
    Flow:
    1. Accept connection
    2. Auth message (token validation)
    3. Create/get session
    4. Initialize TTS track
    5. Setup WebRTC track handler (audio → STT)
    6. Setup ICE candidates
    7. Start Deepgram STT
    8. Message loop (offer/answer/ICE/TTS)
    """
    try:
        await websocket.accept()
        logger.info(f"✅ WebSocket accepted for session: {session_id}")

        try:
            # ─────────────────────────────────────────────
            # Step 1: Auth
            # ─────────────────────────────────────────────
            logger.info("[1] Waiting for auth message...")
            
            first = await asyncio.wait_for(websocket.receive(), timeout=10.0)
            logger.info(f"[1] Received message type: {first.get('type', 'unknown')}")

            if "text" not in first:
                logger.error("❌ [1] Expected text message, got bytes")
                await websocket.close(code=1008, reason="Expected auth JSON")
                return

            try:
                data = json.loads(first["text"])
                logger.info(f"[1] Parsed JSON: {data.get('type')}")
            except Exception as e:
                logger.error(f"❌ [1] JSON parse error: {e}")
                await websocket.close(code=1008, reason="Invalid JSON")
                return

            if data.get("type") != "auth":
                logger.error(f"❌ [1] Expected auth, got: {data.get('type')}")
                await websocket.close(code=1008, reason="First message must be auth")
                return

            token = data.get("token")
            if not token or not is_valid_token(token):
                logger.error("❌ [1] Invalid token")
                await websocket.close(code=1008, reason="Unauthorized")
                return

            logger.info("✅ [1] Auth successful")

            # ─────────────────────────────────────────────
            # Step 2: Session
            # ─────────────────────────────────────────────
            logger.info("[2] Creating/getting session...")
            
            if not session_id:
                session_id = str(uuid.uuid4())
                await websocket.send_json(
                    {"type": "session_id", "session_id": session_id}
                )
                logger.info(f"[2] Created new session: {session_id}")
            else:
                logger.info(f"[2] Using existing session: {session_id}")

            sess = await session_manager.create_or_get(
                session_id=session_id,
                pc_factory=RTCPeerConnection
            )

            pc = sess.pc
            logger.info("✅ [2] Session ready")

            # ─────────────────────────────────────────────
            # Step 3: TTS Audio Track (already initialized in session_manager)
            # ─────────────────────────────────────────────
            logger.info("[3] TTS audio track already initialized")

            # ─────────────────────────────────────────────
            # Step 4: WebRTC track → STT
            # ─────────────────────────────────────────────
            logger.info("[4] Setting up track handler...")
            
            if not sess.track_handler_added:

                @pc.on("track")
                async def on_track(track):
                    if track.kind == "audio":
                        logger.info(f"🎧 Received audio track: {track.id}")
                        asyncio.create_task(
                            stream_audio(track, sess.stt_queue)
                        )

                sess.track_handler_added = True
                logger.info("✅ [4] Track handler attached")
            else:
                logger.info("⚠️ [4] Track handler already attached")

            # ─────────────────────────────────────────────
            # Step 5: ICE candidates
            # ─────────────────────────────────────────────
            logger.info("[5] Setting up ICE handler...")
            
            @pc.on("icecandidate")
            async def on_icecandidate(candidate):
                if candidate:
                    try:
                        await websocket.send_json({
                            "type": "ice",
                            "candidate": {
                                "candidate": candidate.to_sdp(),
                                "sdpMid": candidate.sdpMid,
                                "sdpMLineIndex": candidate.sdpMLineIndex,
                            },
                        })
                    except Exception as e:
                        logger.error(f"❌ [5] ICE send error: {e}")

            logger.info("✅ [5] ICE handler ready")

            # ─────────────────────────────────────────────
            # Step 6: Start Deepgram STT
            # ─────────────────────────────────────────────
            logger.info("[6] Starting Deepgram STT...")
            
            if not sess.deepgram_started:
                sess.deepgram_started = True
                try:
                    deepgram_ws = await connect_deepgram(
                        sess.stt_queue, 
                        websocket, 
                        session_id
                    )
                    if deepgram_ws is None:
                        # connect_deepgram already sent error to client
                        logger.error(f"❌ [6] Deepgram connection returned None")
                        await session_manager.close(session_id)
                        return
                    
                    logger.info("✅ [6] Deepgram STT started successfully")
                except Exception as e:
                    logger.error(f"❌ [6] Failed to start Deepgram: {e}", exc_info=True)
                    try:
                        await websocket.send_json({
                            "type": "error",
                            "error": f"Failed to start STT: {str(e)}"
                        })
                    except:
                        pass
                    await session_manager.close(session_id)
                    return
            else:
                logger.info("⚠️ [6] Deepgram already started")

            # ─────────────────────────────────────────────
            # Step 7: WebSocket message loop
            # ─────────────────────────────────────────────
            logger.info("[7] Entering message loop...")
            
            while True:
                try:
                    logger.debug("[7] Waiting for next message...")
                    message = await asyncio.wait_for(websocket.receive(), timeout=30.0)
                    logger.debug(f"[7] Received message type: {message.get('type', 'unknown')}")

                    # Ignore binary frames
                    if "bytes" in message:
                        logger.debug("[7] Ignoring binary frame")
                        continue

                    if "text" not in message:
                        logger.warning("[7] Ignoring non-text message")
                        continue

                    try:
                        data = json.loads(message["text"])
                    except Exception as e:
                        logger.warning(f"[7] JSON parse error: {e}")
                        continue

                    msg_type = data.get("type")

                    if not msg_type:
                        logger.warning("[7] Message missing type")
                        continue

                    # ───────────────── OFFER ─────────────────
                    if msg_type == "offer":
                        logger.info("[7-OFFER] Processing WebRTC offer...")

                        try:
                            await pc.setRemoteDescription(
                                RTCSessionDescription(
                                    sdp=data["sdp"],
                                    type="offer"
                                )
                            )
                            logger.info("[7-OFFER] Remote description set")
                        except Exception as e:
                            logger.error(f"❌ [7-OFFER] Error setting remote description: {e}")
                            continue

                        # Attach TTS track BEFORE answer
                        if not sess.tts_track_attached:
                            try:
                                pc.addTrack(sess.tts_audio_track)
                                sess.tts_track_attached = True
                                logger.info("🔊 [7-OFFER] TTS track attached")
                            except Exception as e:
                                logger.error(f"❌ [7-OFFER] Error attaching TTS track: {e}")
                                continue

                        try:
                            answer = await pc.createAnswer()
                            await pc.setLocalDescription(answer)
                            logger.info("[7-OFFER] Answer created and local description set")
                        except Exception as e:
                            logger.error(f"❌ [7-OFFER] Error creating answer: {e}")
                            continue

                        try:
                            await websocket.send_json({
                                "type": "answer",
                                "sdp": pc.localDescription.sdp
                            })
                            logger.info("✅ [7-OFFER] Answer sent to client")
                        except Exception as e:
                            logger.error(f"❌ [7-OFFER] Error sending answer: {e}")

                    # ───────────────── ICE ─────────────────
                    elif msg_type == "ice":
                        candidate = data.get("candidate")

                        if candidate:
                            try:
                                ice = candidate_from_sdp(
                                    candidate["candidate"]
                                )

                                ice.sdpMid = candidate.get("sdpMid")
                                ice.sdpMLineIndex = candidate.get("sdpMLineIndex")

                                await pc.addIceCandidate(ice)
                                logger.debug("[7-ICE] ICE candidate added")
                            except Exception as e:
                                logger.error(f"❌ [7-ICE] Error adding ICE candidate: {e}")

                    # ───────────────── TTS ─────────────────
                    elif msg_type in ("question", "tts"):
                        text = data.get("text", "").strip()

                        if text:
                            logger.info(f"🗣️ [7-TTS] TTS request: {text[:50]}")
                            asyncio.create_task(run_tts(text, sess.tts_queue))
                        else:
                            logger.warning("[7-TTS] Empty text in TTS request")

                    else:
                        logger.warning(f"[7] Unknown message type: {msg_type}")

                except asyncio.TimeoutError:
                    logger.warning("[7] Message receive timeout (30s) - checking connection...")
                    continue
                except WebSocketDisconnect:
                    logger.info(f"🔌 Client disconnected: {session_id}")
                    break
                except Exception as e:
                    logger.error(f"[7] Message loop error: {e}", exc_info=True)
                    break

        except asyncio.TimeoutError:
            logger.error("❌ Auth message timeout (10s) - no auth received")
            await websocket.close(code=1008, reason="Auth timeout")
        except WebSocketDisconnect:
            logger.info(f"🔌 Client disconnected during setup: {session_id}")
        except Exception as e:
            logger.error(f"❌ Error in websocket handler: {e}", exc_info=True)
            try:
                await websocket.close(code=1011)
            except Exception:
                pass
        finally:
            # Clean up session
            await session_manager.close(session_id)
            logger.info(f"🧹 Cleanup complete for session: {session_id}")

    except Exception as e:
        logger.error(f"❌ Error accepting websocket: {e}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass