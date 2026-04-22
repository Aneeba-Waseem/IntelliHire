"""
session_utils.py - Consolidated utilities for WebRTC interview sessions

All the supporting classes and functions for webrtc_controller.py in one place.
Keeps the controller clean and focused on message handling.

Includes:
- SessionContext (hour-long interview session)
- QuestionContext (per-question scope)
- InterviewFlowClient (answer submission)
- ConnectionHealthMonitor (keepalive, ICE monitoring)
"""

import asyncio
import time
import logging
from typing import Optional, Dict, Any
import httpx

logger = logging.getLogger(__name__)

FLOW_SUBMISSION_TIMEOUT = 600.0  # 10 min for flow API


# ─────────────────────────────────────────────────────────────────────────────
# SESSION CONTEXT - Hour-long interview
# ─────────────────────────────────────────────────────────────────────────────

class SessionContext:
    """
    Manages task lifecycle for entire WebRTC interview session (1 hour max).
    Survives question changes and Deepgram reconnections.
    
    One instance per interview.
    """

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.tasks = set()
        self.closed = False
        self.created_at = time.time()
        self.client_disconnected = False

    def create_task(self, coro, name: str = None):
        """Create and track a task. Auto-cleanup on completion."""
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
        """Clean up all tasks and mark session closed."""
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


# ─────────────────────────────────────────────────────────────────────────────
# QUESTION CONTEXT - Per-question scope
# ─────────────────────────────────────────────────────────────────────────────

class QuestionContext:
    """
    Manages task lifecycle for a SINGLE question.
    Created when question starts, destroyed when answer collected.
    
    Ensures no task leaks between questions.
    """

    def __init__(self, question_num: int, session_id: str):
        self.question_num = question_num
        self.session_id = session_id
        self.tasks = set()
        self.closed = False

    def create_task(self, coro, name: str = None):
        """Create and track a task within this question."""
        if self.closed:
            logger.warning(f"⚠️ Cannot create task: question {self.question_num} closed")
            return None

        task = asyncio.create_task(coro)
        task.name = name or f"q{self.question_num}-task-{len(self.tasks)}"
        self.tasks.add(task)

        def done_callback(t):
            self.tasks.discard(t)
            if not t.cancelled() and t.exception():
                logger.error(f"❌ Task '{t.name}' failed: {t.exception()}")

        task.add_done_callback(done_callback)
        return task

    async def close(self):
        """Cancel all tasks for this question."""
        if self.closed:
            return

        self.closed = True
        logger.info(f"🛑 Closing question context Q{self.question_num} ({len(self.tasks)} tasks)")

        for task in list(self.tasks):
            if not task.done():
                task.cancel()

        if self.tasks:
            try:
                await asyncio.wait_for(
                    asyncio.gather(*self.tasks, return_exceptions=True),
                    timeout=3.0,
                )
                logger.debug(f"✅ Question tasks cleaned up")
            except asyncio.TimeoutError:
                logger.warning(f"⚠️ Some question tasks didn't cleanup in time")


# ─────────────────────────────────────────────────────────────────────────────
# INTERVIEW FLOW CLIENT - Answer submission
# ─────────────────────────────────────────────────────────────────────────────

class InterviewFlowClient:
    """
    Handles communication with interview flow API.
    Decoupled from WebRTC/Deepgram logic.
    
    One instance per session.
    """

    def __init__(self, token: str, flow_url: str):
        self.token = token
        self.flow_url = flow_url

    async def submit_answer(
        self,
        session_id: str,
        answer_text: str,
    ) -> Dict[str, Any]:
        """
        Submit an answer and get the next question.
        
        Returns:
            {
                "done": bool,
                "next_question": str or None,
                "phase": str or None,
                "report": any or None,
                "message": str or None,
                "error": str or None
            }
        """
        try:
            logger.info(
                f"📤 [FLOW] Submitting answer | session={session_id} "
                f"text={answer_text[:100]}..."
            )

            async with httpx.AsyncClient(timeout=FLOW_SUBMISSION_TIMEOUT) as client:
                response = await client.post(
                    self.flow_url,
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {self.token}",
                    },
                    json={
                        "sessionId": session_id,
                        "answer": answer_text,
                    },
                )

            if response.status_code == 200:
                data = response.json()
                flow_data = data.get("data", {})

                result = {
                    "done": flow_data.get("done", False),
                    "next_question": flow_data.get("question"),
                    "phase": flow_data.get("phase"),
                    "report": flow_data.get("report"),
                    "message": flow_data.get("message"),
                    "error": None,
                }

                logger.info("✅ [FLOW] Answer submitted successfully")
                return result
            else:
                logger.error(f"❌ [FLOW] Failed: HTTP {response.status_code}")
                return {
                    "done": False,
                    "next_question": None,
                    "error": f"Flow API error: {response.status_code}",
                }

        except asyncio.CancelledError:
            logger.info("🛑 [FLOW] Submission cancelled")
            raise

        except httpx.TimeoutException:
            logger.error(f"❌ [FLOW] Submission timed out after {FLOW_SUBMISSION_TIMEOUT}s")
            return {
                "done": False,
                "next_question": None,
                "error": "Flow API timeout",
            }

        except Exception as e:
            logger.error(f"❌ [FLOW] Unexpected error: {e}", exc_info=True)
            return {
                "done": False,
                "next_question": None,
                "error": f"Flow API error: {str(e)}",
            }


# ─────────────────────────────────────────────────────────────────────────────
# UTILITY FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def is_valid_token(token: str) -> bool:
    """Basic token validation."""
    return token and len(token) > 10


async def safe_send_json(websocket, session_ctx: SessionContext, payload: dict) -> bool:
    """Send JSON to client, gracefully handling disconnections."""
    if session_ctx.client_disconnected:
        logger.debug("⚠️ Skipping send — client already disconnected")
        return False
    try:
        await websocket.send_json(payload)
        return True
    except Exception as e:
        logger.warning(f"⚠️ send_json failed (client likely disconnected): {e}")
        session_ctx.client_disconnected = True
        return False


async def run_tts(text: str, tts_queue: asyncio.Queue, question_num: int):
    """Stream TTS audio from Deepgram to the TTS queue."""
    from ..realtime.tts.deepgram_stream import deepgram_pcm_stream
    
    try:
        logger.info(f"🎙️ [Q{question_num}] TTS: Speaking question...")
        async for pcm in deepgram_pcm_stream(text):
            try:
                await asyncio.wait_for(tts_queue.put(pcm), timeout=2.0)
            except asyncio.TimeoutError:
                logger.warning(f"[Q{question_num}] TTS queue full, dropping chunk")
            except asyncio.CancelledError:
                logger.info(f"[Q{question_num}] TTS task cancelled")
                break
            except Exception as e:
                logger.error(f"[Q{question_num}] TTS queue error: {e}")
                break
        logger.info(f"✅ [Q{question_num}] TTS finished")
    except asyncio.CancelledError:
        logger.info(f"[Q{question_num}] TTS cancelled during stream")
    except Exception as e:
        logger.error(f"❌ [Q{question_num}] TTS error: {e}", exc_info=True)


async def run_keepalive(websocket, session_ctx: SessionContext, interval: int = 20):
    """
    Send keepalive pings every N seconds.
    Detects dead connections early.
    """
    while not session_ctx.client_disconnected:
        try:
            await asyncio.sleep(interval)
            sent = await safe_send_json(
                websocket, session_ctx, {"type": "ping", "timestamp": time.time()}
            )
            if not sent:
                break
            logger.debug("💓 Keepalive ping sent")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Keepalive error: {e}")
            break


def handle_ice_restart(ice_candidate_queue: list) -> bool:
    """
    Handle ICE restart request from client.
    Clears candidate queue and signals ready for new gathering.
    """
    logger.warning("⚠️ ICE restart requested by client")
    try:
        ice_candidate_queue.clear()
        logger.info("✅ ICE candidate queue cleared for restart")
        return True
    except Exception as e:
        logger.error(f"❌ ICE restart error: {e}")
        return False


def handle_connection_state_change(pc) -> None:
    """Log connection state changes (for debugging)."""
    state = pc.connectionState
    logger.info(f"📊 Peer connection state: {state}")
    if state == "failed":
        logger.error("❌ Peer connection failed!")
    elif state == "disconnected":
        logger.warning("⚠️ Peer connection disconnected (ICE may recover)")
    elif state == "closed":
        logger.error("❌ Peer connection closed")


def handle_ice_connection_state_change(pc) -> None:
    """Log ICE connection state changes (for debugging)."""
    state = pc.iceConnectionState
    logger.info(f"❄️ ICE connection state: {state}")
    if state in ("connected", "completed"):
        logger.info("✅ ICE CONNECTION ESTABLISHED")
    elif state == "failed":
        logger.error("❌ ICE FAILED - may need restart")
    elif state == "disconnected":
        logger.warning("⚠️ ICE disconnected")