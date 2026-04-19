

import json
import asyncio
import uuid
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceCandidate
from aiortc.sdp import candidate_from_sdp
from ..realtime.session_manager import session_manager
from ..realtime.tts.deepgram_stream import deepgram_pcm_stream
from ..realtime.STT.deepgram_client import connect_deepgram_stt_only
from ..realtime.STT.deepgram_stream import stream_audio
from ..realtime.STT.TranscriptCollectorService import TranscriptCollector
from logging import getLogger
import httpx

logger = getLogger(__name__)
router = APIRouter()

INTERVIEW_FLOW_URL = "http://localhost:8000/api/flow/answer"

# Flow submission timeout — set above your Node.js server's own timeout
FLOW_SUBMISSION_TIMEOUT = 600.0  # seconds


class SessionContext:
    """Manages all tasks and resources for a WebRTC session"""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.tasks = set()
        self.closed = False
        self.created_at = time.time()
        # ✅ FIX: track disconnect state so tasks stop trying to send to a dead socket
        self.client_disconnected = False

    def create_task(self, coro, name: str = None):
        if self.closed:
            logger.warning(f"⚠️ Cannot create task: session {self.session_id} closed")
            return None

        task = asyncio.create_task(coro)
        task.name = name or f"task-{len(self.tasks)}"
        self.tasks.add(task)

        def done_callback(t):
            self.tasks.discard(t)
            if not t.cancelled() and t.exception():
                logger.error(f"❌ Task '{t.name}' failed: {t.exception()}")

        task.add_done_callback(done_callback)
        logger.debug(f"📍 Task created: {task.name} (total: {len(self.tasks)})")
        return task

    async def close(self):
        if self.closed:
            return

        self.closed = True
        self.client_disconnected = True
        duration = time.time() - self.created_at
        logger.info(
            f"🧹 Closing session {self.session_id} "
            f"(duration: {duration:.1f}s, tasks: {len(self.tasks)})"
        )

        for task in list(self.tasks):
            if not task.done():
                task.cancel()
                logger.debug(f"  Cancelled: {task.name}")

        if self.tasks:
            try:
                await asyncio.wait_for(
                    asyncio.gather(*self.tasks, return_exceptions=True),
                    timeout=5.0,
                )
                logger.info("✅ All tasks cleaned up")
            except asyncio.TimeoutError:
                stuck = [t for t in self.tasks if not t.done()]
                logger.error(f"⚠️ {len(stuck)} tasks still running after cleanup timeout")


def is_valid_token(token: str) -> bool:
    return token and len(token) > 10


async def run_tts(text: str, tts_queue: asyncio.Queue):
    try:
        logger.info(f"🎙️ [TTS] Starting TTS: {text[:50]}...")
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
        logger.info("✅ [TTS] Finished streaming")
    except asyncio.CancelledError:
        logger.info("[TTS] TTS task cancelled during stream")
    except Exception as e:
        logger.error(f"❌ [TTS] Deepgram error: {e}", exc_info=True)


async def safe_send_json(websocket: WebSocket, session_ctx: "SessionContext", payload: dict) -> bool:
    """
    ✅ FIX: Centralised send helper that silently no-ops after disconnect.
    Returns True if the send succeeded.
    """
    if session_ctx.client_disconnected:
        logger.debug("⚠️ Skipping send — client already disconnected")
        return False
    try:
        await websocket.send_json(payload)
        return True
    except Exception as e:
        # Any send failure after disconnect is expected — mark and swallow
        logger.warning(f"⚠️ send_json failed (client likely disconnected): {e}")
        session_ctx.client_disconnected = True
        return False


async def submit_answer_to_flow(
    session_id: str,
    answer_text: str,
    token: str,
    websocket: WebSocket,
    session_ctx: "SessionContext",
    time_taken_sec: float = None,
    finalization_reason: str = None,
):
    """
    Submit the complete answer to the interview flow API.
    """
    try:
        logger.info(
            f"📤 [FLOW] Submitting answer | session={session_id} "
            f"time={time_taken_sec:.1f}s reason={finalization_reason} "
            f"text={answer_text[:100]}..."
        )

        async with httpx.AsyncClient(timeout=FLOW_SUBMISSION_TIMEOUT) as client:
            logger.info(f"🔗 [FLOW] Calling {INTERVIEW_FLOW_URL}") 
            response = await client.post(
                INTERVIEW_FLOW_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}",
                },
                json={
                    "sessionId": session_id,
                    "answer": answer_text
                },
            )
        logger.info(f"✅ [FLOW] Response: HTTP {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            logger.info("✅ [FLOW] Answer submitted successfully")

            if data.get("data", {}).get("done"):
                logger.info("🎉 [FLOW] Interview completed!")
                await safe_send_json(
                    websocket,
                    session_ctx,
                    {
                        "type": "interview_complete",
                        "report": data.get("data", {}).get("report"),
                        "message": data.get("data", {}).get("message"),
                    },
                )
            else:
                next_question = data.get("data", {}).get("question")
                if next_question:
                    sent = await safe_send_json(
                        websocket,
                        session_ctx,
                        {
                            "type": "next_question",
                            "text": next_question,
                            "phase": data.get("data", {}).get("phase"),
                        },
                    )
                    if sent:
                        logger.info("📨 Sent next question")
        else:
            logger.error(f"❌ [FLOW] Failed: HTTP {response.status_code}")
            await safe_send_json(
                websocket,
                session_ctx,
                
                {
                    "type": "error",
                    "error": f"Failed to process answer (status {response.status_code})",
                },
            )

    except asyncio.CancelledError:
        # ✅ FIX: Session is shutting down — exit cleanly without logging as an error
        logger.info("🛑 [FLOW] Submission cancelled (session closing)")
        raise  # re-raise so the task framework sees a clean cancellation

    except httpx.TimeoutException:
        # ✅ FIX: Log clearly and only attempt send if client is still alive
        logger.error(
            f"❌ [FLOW] Submission timed out after {FLOW_SUBMISSION_TIMEOUT}s "
            f"for session {session_id}"
        )
        await safe_send_json(
            websocket,
            session_ctx,
            {"type": "error", "error": "Interview flow server timeout — please retry"},
        )

    except Exception as e:
        logger.error(f"❌ [FLOW] Unexpected error: {e}", exc_info=True)
        await safe_send_json(
            websocket,
            session_ctx,
            {"type": "error", "error": f"Failed to submit answer: {str(e)}"},
        )


class QuestionDeepgramSession:
    """
    ✅ FIXED: Manages Deepgram connection for ONE question.
    
    KEY CHANGES:
    1. Does NOT receive the main WebSocket
    2. Uses only callbacks for transcript updates
    3. Isolated cleanup that doesn't affect WebRTC
    """

    def __init__(self, question_num: int, session_id: str):
        self.question_num = question_num
        self.session_id = session_id
        self.deepgram_ws = None
        self.collector = None
        self.start_time = None

    async def open(
        self,
        # stt_queue: asyncio.Queue,
        session_ctx: SessionContext,
        on_interim_transcript=None,
    ):
        """
        FIXED: Only receives stt_queue and session_ctx, NOT the main WebSocket.
        Transcript updates are handled via callbacks.
        """
        logger.info(f"📍 [Q{self.question_num}] Opening Deepgram connection")
        self.start_time = time.time()

         # ✅ NEW: Create isolated queue for THIS question only
        self.stt_queue = asyncio.Queue(maxsize=900000)
        logger.info(f"   Created isolated STT queue")
        
        self.collector = TranscriptCollector(
            max_answer_time_sec=240,        # 4 min in total
            silence_timeout_ms=15000,      # silence timeout - 15 sec - 30 sec total
            on_complete=None,
            on_interim=on_interim_transcript or (
                lambda text: logger.debug(f"🟡 [Q{self.question_num}] Interim: {text[:50]}...")
            ),
            on_timeout=None,
        )

        try:
            # ✅ FIXED: Do NOT pass the main websocket to Deepgram
            self.deepgram_ws, _ = await connect_deepgram_stt_only(
                self.stt_queue,
                websocket=None,  # Important: Deepgram session should NOT have direct access to the main WebSocket
                session_id=self.session_id,
                transcript_collector=self.collector,
                session_ctx=session_ctx,
            )
            logger.info(f"deepgram object in client ... {self.deepgram_ws}")

            if not self.deepgram_ws:
                logger.error(f"❌ [Q{self.question_num}] Deepgram connection failed")
                return False

            logger.info(f"✅ [Q{self.question_num}] Deepgram connected")
            await self.collector.start_timer()
            logger.info(f"⏱️ [Q{self.question_num}] Answer timer started (4 min window)")
            return True

        except Exception as e:
            logger.error(f"❌ [Q{self.question_num}] Error opening Deepgram: {e}", exc_info=True)
            return False

    async def wait_for_answer(self) -> tuple[str, str, float]:
        """Wait for the answer to be complete. Safe to call multiple times."""
        logger.info(f"⏳ [Q{self.question_num}] Waiting for answer...")
        try:
            answer = await self.collector.wait_for_complete()
            elapsed = time.time() - self.start_time
            reason = self.collector.finalization_reason

            if reason == "timeout":
                logger.warning(f"🛑 [Q{self.question_num}] Hard timeout at {elapsed:.1f}s")
            else:
                logger.info(
                    f"✅ [Q{self.question_num}] Answer ready at {elapsed:.1f}s (reason: {reason})"
                )

            return answer, reason, elapsed

        except asyncio.CancelledError:
            logger.info(f"🛑 [Q{self.question_num}] Answer wait cancelled")
            raise
        except Exception as e:
            logger.error(f"❌ [Q{self.question_num}] Error waiting for answer: {e}", exc_info=True)
            elapsed = time.time() - self.start_time
            return self.collector.get_current_utterance(), "error", elapsed

    async def close(self):
        """
        ✅ FIXED: Safely close only Deepgram resources.
        This should NOT affect the WebRTC peer connection.
        """
        logger.info(f"🛑 [Q{self.question_num}] Closing Deepgram session (NOT WebRTC)")

        if self.collector:
            try:
                # Stop the collector first to finalize any pending audio
                await self.collector.stop()
                logger.debug(f"✅ [Q{self.question_num}] Collector stopped")
            except Exception as e:
                logger.error(f"⚠️ [Q{self.question_num}] Error stopping collector: {e}")

        if self.deepgram_ws:
            try:
                # ✅ CRITICAL: Only close the Deepgram WebSocket, NOT the main one
                await self.deepgram_ws.close()
                logger.info(f"✅ [Q{self.question_num}] Deepgram WebSocket closed")
            except Exception as e:
                logger.error(f"⚠️ [Q{self.question_num}] Error closing Deepgram WS: {e}")

        # Reset state for next question
        if self.collector:
            try:
                self.collector.reset_for_next_question()
                logger.debug(f"🔄 [Q{self.question_num}] Collector reset for next question")
            except Exception as e:
                logger.error(f"⚠️ [Q{self.question_num}] Error resetting collector: {e}")

        logger.info(f"✅ [Q{self.question_num}] Deepgram session cleanup complete")


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str = None):
    """
    Main WebRTC + Per-Question STT/TTS endpoint
    Deepgram sessions are isolated from WebRTC.
    Closing a Deepgram session will NOT close the WebRTC connection.
    """

    token = None
    pc = None
    session_ctx = None
    question_num = 0
    current_deepgram_session: QuestionDeepgramSession = None
    consecutive_timeouts = 0
    current_stt_queue = None

    try:
        await websocket.accept()
        logger.info(f"✅ WebSocket accepted for session: {session_id}")

        try:
            # ─────────────────────────────────────────────
            # Auth
            # ─────────────────────────────────────────────
            first = await asyncio.wait_for(websocket.receive(), timeout=10.0)

            if "text" not in first:
                logger.error("❌ Expected text message")
                await websocket.close(code=1008, reason="Expected auth JSON")
                return

            try:
                data = json.loads(first["text"])
            except Exception as e:
                logger.error(f"❌ JSON parse error: {e}")
                await websocket.close(code=1008, reason="Invalid JSON")
                return

            if data.get("type") != "auth":
                logger.error(f"❌ Expected auth, got: {data.get('type')}")
                await websocket.close(code=1008, reason="First message must be auth")
                return

            token = data.get("token")
            if not token or not is_valid_token(token):
                logger.error("❌ Invalid token")
                await websocket.close(code=1008, reason="Unauthorized")
                return

            logger.info("✅ Auth successful")

            # ─────────────────────────────────────────────
            # Session
            # ─────────────────────────────────────────────
            # logger.info("[2] Creating/getting WebRTC session...")

            # if not session_id:
            #     session_id = str(uuid.uuid4())
            #     await websocket.send_json({"type": "session_id", "session_id": session_id})
            #     logger.info(f"Created new session: {session_id}")

            sess = await session_manager.create_or_get(
                session_id=session_id, pc_factory=RTCPeerConnection
            )

            pc = sess.pc
            session_ctx = SessionContext(session_id)
            logger.info("✅ Session ready")

            # ─────────────────────────────────────────────
            # ICE Handler
            # ─────────────────────────────────────────────
            logger.info("[3] Setting up ICE candidate handler...")
            ice_candidate_queue = []

            @pc.on("icecandidate")
            async def on_icecandidate(candidate):
                if candidate:
                    candidate_info = {
                        "candidate": candidate.to_sdp(),
                        "sdpMid": candidate.sdpMid,
                        "sdpMLineIndex": candidate.sdpMLineIndex,
                    }
                    ice_candidate_queue.append(candidate_info)
                    await safe_send_json(
                        websocket, session_ctx, {"type": "ice", "candidate": candidate_info}
                    )
                else:
                    logger.info(f"✅ ICE gathering complete ({len(ice_candidate_queue)} candidates)")

            logger.info("✅ ICE handler ready")

            # ─────────────────────────────────────────────
            # Connection State Monitoring
            # ─────────────────────────────────────────────
            @pc.on("connectionstatechange")
            async def on_connectionstatechange():
                state = pc.connectionState
                logger.info(f"📊 Peer connection: {state}")
                if state == "failed":
                    logger.error("❌ Peer connection failed!")
                    await safe_send_json(
                        websocket, session_ctx, {"type": "error", "error": "Peer connection failed"}
                    )

            @pc.on("iceconnectionstatechange")
            async def on_iceconnectionstatechange():
                state = pc.iceConnectionState
                logger.info(f"❄️ ICE connection: {state}")
                if state in ("connected", "completed"):
                    logger.info("✅ ICE CONNECTION ESTABLISHED")

            # ─────────────────────────────────────────────
            # Keepalive
            # ─────────────────────────────────────────────
            async def send_keepalive():
                while not session_ctx.client_disconnected:
                    try:
                        await asyncio.sleep(30)
                        sent = await safe_send_json(
                            websocket, session_ctx, {"type": "keepalive", "timestamp": time.time()}
                        )
                        if sent:
                            logger.debug("Keepalive sent")
                        else:
                            break
                    except asyncio.CancelledError:
                        break
                    except Exception as e:
                        logger.error(f"Keepalive error: {e}")
                        break

            session_ctx.create_task(send_keepalive(), name="keepalive")

            # ─────────────────────────────────────────────
            # Track Handler
            # ─────────────────────────────────────────────
            if not sess.track_handler_added:
                @pc.on("track")
                async def on_track(track):
                    if track.kind == "audio":
                        logger.info(f"Audio track: {track.id}")
                        session_ctx.create_task(
                            stream_audio(track, lambda: current_stt_queue),
                            name=f"stream-audio-{track.id}",
                        )

                sess.track_handler_added = True
                logger.info("✅ Track handler ready")

            # ─────────────────────────────────────────────
            # Message Loop
            # ─────────────────────────────────────────────
            logger.info("[5] Entering message loop...")

            while True:
                if session_ctx.client_disconnected:
                    logger.info("[5] Client disconnected — exiting message loop cleanly")
                    break

                try:
                    logger.debug("[5] Waiting for message (timeout: 60s)...")
                    message = await asyncio.wait_for(websocket.receive(), timeout=60.0)
                    consecutive_timeouts = 0

                    if message.get("type") == "websocket.disconnect":
                        logger.info("[5] Received disconnect frame — exiting message loop")
                        session_ctx.client_disconnected = True
                        break

                    if "bytes" in message:
                        logger.debug("[5] Ignoring binary frame")
                        continue

                    if "text" not in message:
                        logger.warning("[5] Ignoring non-text message")
                        continue

                    try:
                        data = json.loads(message["text"])
                    except Exception as e:
                        logger.warning(f"[5] JSON parse error: {e}")
                        continue

                    msg_type = data.get("type")
                    if not msg_type:
                        logger.warning("[5] Message missing type")
                        continue

                    # ───────────────── OFFER ─────────────────
                    if msg_type == "offer":
                        logger.info("[5-OFFER] Processing WebRTC offer...")

                        try:
                            await pc.setRemoteDescription(
                                RTCSessionDescription(sdp=data["sdp"], type="offer")
                            )
                            logger.info("[5-OFFER] Remote description set")

                            for candidate_info in ice_candidate_queue:
                                await safe_send_json(
                                    websocket,
                                    session_ctx,
                                    {"type": "ice", "candidate": candidate_info},
                                )
                            logger.info(f"✅ {len(ice_candidate_queue)} queued ICE candidates flushed")
                        except Exception as e:
                            logger.error(f"❌ setRemoteDescription error: {e}")
                            continue

                        if not sess.tts_track_attached:
                            try:
                                pc.addTrack(sess.tts_audio_track)
                                sess.tts_track_attached = True
                                logger.info("🔊 TTS track attached")
                            except Exception as e:
                                logger.error(f"❌ addTrack error: {e}")
                                continue

                        try:
                            answer = await pc.createAnswer()
                            await pc.setLocalDescription(answer)
                        except Exception as e:
                            logger.error(f"❌ createAnswer error: {e}")
                            continue

                        await safe_send_json(
                            websocket, session_ctx, {"type": "answer", "sdp": pc.localDescription.sdp}
                        )
                        logger.info("✅ Answer sent")

                    # ───────────────── ICE ─────────────────
                    elif msg_type == "ice":
                        candidate = data.get("candidate")
                        if candidate:
                            try:
                                ice = candidate_from_sdp(candidate["candidate"])
                                ice.sdpMid = candidate.get("sdpMid")
                                ice.sdpMLineIndex = candidate.get("sdpMLineIndex")
                                await pc.addIceCandidate(ice)
                                logger.debug("✅ ICE candidate added")
                            except Exception as e:
                                logger.error(f"❌ addIceCandidate error: {e}")

                    # ───────────────── QUESTION ─────────────────
                    elif msg_type == "question":
                        question_text = data.get("text", "").strip()
                        if not question_text:
                            logger.warning("❌ Empty question text")
                            continue

                        question_num += 1
                        logger.info(f"\n{'='*70}")
                        logger.info(f"📋 QUESTION #{question_num}")
                        logger.info(f"{'='*70}")
                        logger.info(f"Text: {question_text}")

                        if current_deepgram_session:
                            logger.info("🛑 Closing previous Deepgram session")
                            # This only closes Deepgram, not WebRTC
                            await current_deepgram_session.close()

                        # Create new Deepgram session without passing main WebSocket
                        current_deepgram_session = QuestionDeepgramSession(
                            question_num, sess.interview_session_id
                        )
                        
                        success = await current_deepgram_session.open(
                            session_ctx,
                            # Optional: callback for interim transcripts
                            on_interim_transcript=lambda text: logger.debug(
                                f"🟡 [Q{question_num}] Interim: {text[:50]}..."
                            ),
                        )

                        if not success:
                            logger.error(f"❌ Failed to open Deepgram for Q{question_num}")
                            await safe_send_json(
                                websocket,
                                session_ctx,
                                {"type": "error", "error": "Failed to start STT for question"},
                            )
                            continue

                        current_stt_queue = current_deepgram_session.stt_queue

                        logger.info(f"🗣️ [Q{question_num}] Speaking question...")
                        session_ctx.create_task(
                            run_tts(question_text, sess.tts_queue),
                            name=f"tts-q{question_num}",
                        )

                        # Capture loop variable for the closure
                        q_session_snapshot = current_deepgram_session
                        q_num_snapshot = question_num

                        async def handle_question_answer(q_session, q_num):
                            try:
                                answer_text, reason, elapsed = await q_session.wait_for_answer()
                                await q_session.close()
                                
                                logger.debug(f"🔐 [Q{q_num}] Token available: {bool(token)}")
                                
                                # ✅ CLEAR QUEUE HERE
                                nonlocal current_stt_queue
                                current_stt_queue = None
                                
                                await submit_answer_to_flow(
                                    session_id=sess.interview_session_id,
                                    answer_text=answer_text,
                                    token=token,
                                    websocket=websocket,
                                    session_ctx=session_ctx,
                                    time_taken_sec=elapsed,
                                    finalization_reason=reason,
                                )
                            except asyncio.CancelledError:
                                logger.info(f"🛑 answer-handler Q{q_num} cancelled")
                            except Exception as e:
                                logger.error(
                                    f"❌ Error handling Q{q_num} answer: {e}", exc_info=True
                                )

                        session_ctx.create_task(
                            handle_question_answer(q_session_snapshot, q_num_snapshot),
                            name=f"answer-handler-q{question_num}",
                        )

                    # ───────────────── INTERVIEW SESSION ID ─────────────────
                    elif msg_type == "interview_session_id":
                        sess.interview_session_id = data.get("interview_session_id")
                        logger.info(f"✅ Interview session ID: {sess.interview_session_id}")

                    elif msg_type == "auth":
                        new_token = data.get("token")
                        if new_token and is_valid_token(new_token):
                            token = new_token
                            logger.info("✅ Token updated")
                        else:
                            logger.warning("⚠️ Invalid token in auth message")

                    # ───────────────── LISTENING STATE ─────────────────
                    elif msg_type == "listening_started":
                        logger.info("[5] Listening started")

                    elif msg_type == "listening_stopped":
                        logger.info("[5] Listening stopped")
                        if current_deepgram_session and current_deepgram_session.collector:
                            try:
                                await asyncio.wait_for(
                                    current_deepgram_session.collector.force_finalize(),
                                    timeout=2.0,
                                )
                            except Exception:
                                pass

                    else:
                        logger.warning(f"[5] Unknown message type: {msg_type}")

                except asyncio.TimeoutError:
                    consecutive_timeouts += 1
                    logger.warning(
                        f"⚠️ No message for 10s (timeout #{consecutive_timeouts}/2)"
                    )

                    if consecutive_timeouts >= 2:
                        logger.warning("⚠️ No activity for 60s - force finalizing answer")
                        if current_deepgram_session and current_deepgram_session.collector:
                            try:
                                await asyncio.wait_for(
                                    current_deepgram_session.collector.force_finalize(),
                                    timeout=2.0
                                )
                                logger.info("✅ Answer force finalized")
                            except Exception as e:
                                logger.error(f"Error force finalizing: {e}")
                        consecutive_timeouts = 0
                        
                    sent = await safe_send_json(
                        websocket, session_ctx, {"type": "ping", "timestamp": time.time()}
                    )
                    if not sent:
                        # Client is gone, no point waiting for the next timeout
                        break

                    continue

                except WebSocketDisconnect:
                    # ✅ FIX 3: Mark disconnected before breaking so no further sends are attempted
                    logger.info("[5] Client disconnected (WebSocketDisconnect)")
                    session_ctx.client_disconnected = True
                    break

                except RuntimeError as e:
                    # ✅ FIX 3: Catch the specific error that was crashing the loop
                    if "disconnect message has been received" in str(e):
                        logger.info(
                            "[5] Received post-disconnect receive() call — exiting message loop"
                        )
                        session_ctx.client_disconnected = True
                    else:
                        logger.error(f"[5] RuntimeError in message loop: {e}", exc_info=True)
                    break

                except Exception as e:
                    logger.error(f"[5] Message loop error: {e}", exc_info=True)
                    break

        except asyncio.TimeoutError:
            logger.error("❌ Auth timeout")
            try:
                await websocket.close(code=1008, reason="Auth timeout")
            except Exception:
                pass
        except WebSocketDisconnect:
            logger.info("🔌 Client disconnected during setup")
        except Exception as e:
            logger.error(f"❌ Setup error: {e}", exc_info=True)
            try:
                await websocket.close(code=1011)
            except Exception:
                pass
        finally:
            # ─────────────────────────────────────────────
            # Cleanup
            # ─────────────────────────────────────────────
            logger.info(f"🧹 Cleaning up session {session_id}")

            if current_deepgram_session:
                try:
                    await current_deepgram_session.close()
                    logger.info("✅ Deepgram session cleaned up")
                except Exception as e:
                    logger.warning(f"⚠️ Error closing Deepgram: {e}")

            # ✅ FIX: Mark disconnected before cancelling tasks so in-flight
            #    answer-handler tasks skip any remaining websocket sends
            if session_ctx:
                session_ctx.client_disconnected = True
                await session_ctx.close()

            if pc:
                try:
                    await pc.close()
                    logger.info("✅ PeerConnection closed")
                except Exception as e:
                    logger.warning(f"⚠️ Error closing PeerConnection: {e}")

            await session_manager.close(session_id)
            logger.info("✅ Cleanup complete")

    except Exception as e:
        logger.error(f"❌ Error accepting websocket: {e}", exc_info=True)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass