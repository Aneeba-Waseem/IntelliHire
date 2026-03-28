"""
Fixed webrtc_router.py (FastAPI WebSocket endpoint)

Integration with TranscriptCollector for VAD-based answer collection.

Key Changes:
- ⭐ PROPER ICE CANDIDATE HANDLING (queue candidates before connection)
- ⭐ CONNECTION STATE MONITORING (detect failures early)
- ⭐ AUTOMATIC ANSWER SUBMISSION (via TranscriptCollector callback)
- Better error handling and logging
- Proper resource cleanup
"""

import json
import asyncio
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceCandidate
from aiortc.sdp import candidate_from_sdp
from ..realtime.session_manager import session_manager
from ..realtime.tts.deepgram_stream import deepgram_pcm_stream
from ..realtime.STT.deepgram_client import connect_deepgram
from ..realtime.STT.deepgram_stream import stream_audio
from ..realtime.STT.TranscriptCollectorService import TranscriptCollector
from logging import getLogger
import httpx

logger = getLogger(__name__)
router = APIRouter()

# ⭐ URL for submitting answers to Node.js interview flow
INTERVIEW_FLOW_URL = "http://localhost:8000/api/flow/answer"


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


async def submit_answer_to_flow(
    session_id: str, 
    answer_text: str, 
    token: str,
    websocket: WebSocket
):
    """
    ⭐ Submit the complete answer to Node.js interview flow.
    
    This is called when TranscriptCollector has a complete utterance.
    The answer is sent to /api/flow/answer which processes it and
    generates the next question.
    
    Args:
        session_id: Interview session ID
        answer_text: Complete transcript text from Deepgram
        token: Auth token for interview API
        websocket: Client WebSocket connection
    """
    try:
        logger.info(f"📤 [FLOW] Submitting answer to interview flow:")
        logger.info(f"    Session: {session_id}")
        logger.info(f"    Answer: {answer_text[:100]}...")
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                INTERVIEW_FLOW_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}",
                },
                json={
                    "sessionId": session_id,
                    "answer": answer_text,
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"✅ [FLOW] Answer submitted successfully")
                logger.info(f"    Response: {data.get('data', {})}")
                
                # Check if interview is done
                if data.get("data", {}).get("done"):
                    logger.info("🎉 [FLOW] Interview completed!")
                    report = data.get("data", {}).get("report")
                    
                    try:
                        await websocket.send_json({
                            "type": "interview_complete",
                            "report": report,
                            "message": data.get("data", {}).get("message")
                        })
                    except Exception as e:
                        logger.error(f"Error sending completion to client: {e}")
                else:
                    # Next question available
                    next_question = data.get("data", {}).get("question")
                    next_phase = data.get("data", {}).get("phase")
                    
                    if next_question:
                        try:
                            await websocket.send_json({
                                "type": "next_question",
                                "text": next_question,
                                "phase": next_phase
                            })
                            logger.info(f"  📨 Sent next question to client")
                        except Exception as e:
                            logger.error(f"Error sending next question: {e}")
            else:
                logger.error(f"❌ [FLOW] Answer submission failed: {response.status_code}")
                logger.error(f"    Response: {response.text}")
                
                try:
                    await websocket.send_json({
                        "type": "error",
                        "error": f"Failed to process answer (status {response.status_code})",
                        "details": response.text[:200]
                    })
                except Exception as e:
                    logger.error(f"Error sending error to client: {e}")
    
    except httpx.TimeoutException:
        logger.error("❌ [FLOW] Answer submission timeout (30s)")
        try:
            await websocket.send_json({
                "type": "error",
                "error": "Interview flow server timeout"
            })
        except Exception as e:
            logger.error(f"Error sending error to client: {e}")
    
    except Exception as e:
        logger.error(f"❌ [FLOW] Answer submission error: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "type": "error",
                "error": f"Failed to submit answer: {str(e)}"
            })
        except Exception as e:
            logger.error(f"Error sending error to client: {e}")


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str = None):
    """
    Main WebRTC + STT/TTS WebSocket endpoint with VAD-based transcript handling.
    
    ⭐ FIXED FLOW:
    1. Accept connection
    2. Auth message (token validation)
    3. Create/get session with TranscriptCollector
    4. Initialize TTS track
    5. Setup ICE candidate handler (BEFORE offer)
    6. Setup connection state monitoring
    7. Setup track handler
    8. Start Deepgram STT with TranscriptCollector
    9. Message loop (handles offer/answer/ICE/TTS)
    10. Auto-submit complete answers to interview flow
    """
    
    token = None
    transcript_collector = None
    pc = None
    
    try:
        await websocket.accept()
        logger.info(f"✅ WebSocket accepted for session: {session_id}")

        try:
            # ─────────────────────────────────────────────
            # Step 1: Auth
            # ─────────────────────────────────────────────
            logger.info("[1] Waiting for auth message...")
            
            first = await asyncio.wait_for(websocket.receive(), timeout=10.0)
            
            if "text" not in first:
                logger.error("❌ [1] Expected text message")
                await websocket.close(code=1008, reason="Expected auth JSON")
                return

            try:
                data = json.loads(first["text"])
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
            # Step 2.5: Create TranscriptCollector
            # ─────────────────────────────────────────────
            logger.info("[2.5] Creating TranscriptCollector...")
            
            transcript_collector = TranscriptCollector(
                on_complete=None,  # Will be set after Deepgram connects
                on_interim=lambda text: logger.debug(f"🟡 [INTERIM] {text[:50]}..."),
                max_silence_ms=2000
            )
            logger.info("✅ [2.5] TranscriptCollector ready")

            # ─────────────────────────────────────────────
            # ⭐ Step 3: Setup Connection State Monitoring
            # ─────────────────────────────────────────────
            logger.info("[3] Setting up connection state monitoring...")
            
            @pc.on("connectionstatechange")
            async def on_connectionstatechange():
                state = pc.connectionState
                logger.info(f"📊 [PC] Peer connection state: {state}")
                
                if state == "connected" or state == "completed":
                    logger.info("✅ [PC] PEER CONNECTION ESTABLISHED - RTP should flow")
                elif state == "failed":
                    logger.error("❌ [PC] PEER CONNECTION FAILED - RTP will not flow!")
                    try:
                        await websocket.send_json({
                            "type": "error",
                            "error": "Peer connection failed",
                            "state": state
                        })
                    except Exception as e:
                        logger.error(f"Error sending error to client: {e}")
                elif state == "disconnected":
                    logger.warning("⚠️ [PC] Peer connection disconnected")
            
            @pc.on("iceconnectionstatechange")
            async def on_iceconnectionstatechange():
                state = pc.iceConnectionState
                logger.info(f"❄️ [ICE] ICE connection state: {state}")
                
                if state == "connected" or state == "completed":
                    logger.info("✅ [ICE] ICE CONNECTION ESTABLISHED - Audio path ready")
                elif state == "failed":
                    logger.error("❌ [ICE] ICE CONNECTION FAILED - NO AUDIO WILL FLOW!")
                    try:
                        await websocket.send_json({
                            "type": "error",
                            "error": "ICE connection failed",
                            "state": state
                        })
                    except Exception as e:
                        logger.error(f"Error sending error to client: {e}")
                elif state == "disconnected":
                    logger.warning("⚠️ [ICE] ICE connection disconnected (may reconnect)")
            
            @pc.on("icegatheringstatechange")
            async def on_icegatheringstatechange():
                state = pc.iceGatheringState
                logger.debug(f"🔄 [ICE] ICE gathering state: {state}")
            
            logger.info("✅ [3] Connection state monitoring enabled")

            # ─────────────────────────────────────────────
            # ⭐ Step 4: Setup ICE Candidate Handler EARLY
            # ─────────────────────────────────────────────
            logger.info("[4] Setting up ICE candidate handler...")
            
            ice_candidate_queue = []
            ice_candidates_sent = False

            @pc.on("icecandidate")
            async def on_icecandidate(candidate):
                """
                ⭐ CRITICAL: Send ICE candidates to client
                Queue if WebSocket not ready, send immediately if it is
                """
                if candidate:
                    candidate_info = {
                        "candidate": candidate.to_sdp(),
                        "sdpMid": candidate.sdpMid,
                        "sdpMLineIndex": candidate.sdpMLineIndex,
                    }
                    
                    ice_candidate_queue.append(candidate_info)
                    logger.debug(f"📍 [ICE] Candidate queued: {candidate.to_sdp()[:60]}...")
                    
                    # If WebSocket is ready, send immediately
                    if websocket and websocket.client_state.value == 1:  # CONNECTED
                        try:
                            await websocket.send_json({
                                "type": "ice",
                                "candidate": candidate_info,
                            })
                            logger.debug(f"  ✅ [ICE] Candidate sent immediately")
                        except Exception as e:
                            logger.error(f"❌ [ICE] Send error: {e}")
                else:
                    # ICE gathering complete
                    logger.info(f"✅ [ICE] ICE gathering complete ({len(ice_candidate_queue)} candidates)")

            logger.info("✅ [4] ICE candidate handler ready")

            # ─────────────────────────────────────────────
            # Step 5: Track Handler
            # ─────────────────────────────────────────────
            logger.info("[5] Setting up track handler...")
            
            if not sess.track_handler_added:

                @pc.on("track")
                async def on_track(track):
                    if track.kind == "audio":
                        logger.info(f"🎧 Received audio track: {track.id}")
                        asyncio.create_task(
                            stream_audio(track, sess.stt_queue)
                        )

                sess.track_handler_added = True
                logger.info("✅ [5] Track handler attached")

            # ─────────────────────────────────────────────
            # Step 6: Start Deepgram STT with TranscriptCollector
            # ─────────────────────────────────────────────
            logger.info("[6] Starting Deepgram STT with TranscriptCollector...")
            
            if not sess.deepgram_started:
                sess.deepgram_started = True
                try:
                    deepgram_ws, returned_collector = await connect_deepgram(
                        sess.stt_queue, 
                        websocket, 
                        session_id,
                        transcript_collector=transcript_collector
                    )
                    
                    if deepgram_ws is None:
                        logger.error(f"❌ [6] Deepgram connection failed")
                        await session_manager.close(session_id)
                        return
                    
                    # ⭐ NEW: Update collector to submit answers automatically
                    async def on_complete_utterance(text: str):
                        """Auto-submit complete utterance to interview flow"""
                        logger.info(f"✅ [COLLECTOR] Complete utterance: {text[:100]}...")
                        
                        # Notify client that we're processing
                        try:
                            await websocket.send_json({
                                "type": "answer_received",
                                "text": text,
                                "status": "processing"
                            })
                        except Exception as e:
                            logger.error(f"Error sending ACK to client: {e}")

                        logger.info(f"📍 Interview session ID: {sess.interview_session_id}")
                        
                        # Submit to interview flow
                        await submit_answer_to_flow(
                            session_id=sess.interview_session_id,
                            answer_text=text,
                            token=token,
                            websocket=websocket
                        )
                    
                    transcript_collector.on_complete = on_complete_utterance
                    
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
                    message = await asyncio.wait_for(websocket.receive(), timeout=90000.0)
                    
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
                            
                            # ⭐ CRITICAL: Flush queued ICE candidates now
                            logger.info(f"[7-OFFER] Flushing {len(ice_candidate_queue)} queued ICE candidates...")
                            for candidate_info in ice_candidate_queue:
                                try:
                                    await websocket.send_json({
                                        "type": "ice",
                                        "candidate": candidate_info,
                                    })
                                except Exception as e:
                                    logger.error(f"❌ [ICE] Flush error: {e}")
                            ice_candidates_sent = True
                            logger.info(f"✅ [7-OFFER] All queued candidates flushed")
                        
                        except Exception as e:
                            logger.error(f"❌ [7-OFFER] Error: {e}")
                            continue

                        if not sess.tts_track_attached:
                            try:
                                pc.addTrack(sess.tts_audio_track)
                                sess.tts_track_attached = True
                                logger.info("🔊 [7-OFFER] TTS track attached")
                            except Exception as e:
                                logger.error(f"❌ [7-OFFER] Error attaching TTS: {e}")
                                continue

                        try:
                            answer = await pc.createAnswer()
                            await pc.setLocalDescription(answer)
                            logger.info("[7-OFFER] Answer created")
                        except Exception as e:
                            logger.error(f"❌ [7-OFFER] Error creating answer: {e}")
                            continue

                        try:
                            await websocket.send_json({
                                "type": "answer",
                                "sdp": pc.localDescription.sdp
                            })
                            logger.info("✅ [7-OFFER] Answer sent")
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
                                logger.debug("✅ [7-ICE] Client ICE candidate added")
                            except Exception as e:
                                logger.error(f"❌ [7-ICE] Error: {e}")

                    # ───────────────── Interview ID ─────────────────
                    elif msg_type == "interview_session_id":
                        sess.interview_session_id = data.get("interview_session_id")
                        logger.info(f"✅ [7-SESSION] Interview session ID stored: {sess.interview_session_id}")

                    # ───────────────── TTS (Question) ─────────────────
                    elif msg_type in ("question", "tts"):
                        text = data.get("text", "").strip()

                        if text:
                            logger.info(f"🗣️ [7-TTS] TTS request: {text[:50]}...")
                            asyncio.create_task(run_tts(text, sess.tts_queue))
                        else:
                            logger.warning("[7-TTS] Empty text in request")

                    # ───────────────── LISTENING STATE ─────────────────
                    elif msg_type == "listening_started":
                        logger.info("[7-LISTEN] Client started listening")
                    
                    elif msg_type == "listening_stopped":
                        logger.info("[7-LISTEN] Client stopped listening")
                        # Force finalize any pending transcript
                        if transcript_collector:
                            await transcript_collector.force_finalize()

                    else:
                        logger.warning(f"[7] Unknown message type: {msg_type}")

                except asyncio.TimeoutError:
                    logger.warning("[7] Message receive timeout - checking connection...")
                    continue
                except WebSocketDisconnect:
                    logger.info(f"🔌 Client disconnected: {session_id}")
                    break
                except Exception as e:
                    logger.error(f"[7] Message loop error: {e}", exc_info=True)
                    break

        except asyncio.TimeoutError:
            logger.error("❌ Auth message timeout")
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
            # ─────────────────────────────────────────────
            # Cleanup
            # ─────────────────────────────────────────────
            logger.info(f"🧹 [CLEANUP] Starting cleanup for session: {session_id}")
            
            # Force finalize collector if still open
            if transcript_collector:
                try:
                    await transcript_collector.force_finalize()
                    logger.info(f"  ✅ Transcript collector finalized")
                except Exception as e:
                    logger.warning(f"  ⚠️ Error finalizing collector: {e}")
            
            # Close peer connection
            if pc:
                try:
                    await pc.close()
                    logger.info(f"  ✅ Peer connection closed")
                except Exception as e:
                    logger.warning(f"  ⚠️ Error closing peer connection: {e}")
            
            # Clean up session
            await session_manager.close(session_id)
            logger.info(f"✅ [CLEANUP] Complete for session: {session_id}")

    except Exception as e:
        logger.error(f"❌ Error accepting websocket: {e}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass