"""
DeepgramManager - Per-Question STT Session Factory

Handles all Deepgram STT connection lifecycle.
NOT a persistent connection - creates fresh sessions per question.

Key responsibilities:
1. Create new Deepgram WebSocket connections on demand
2. Validate connection health
3. Handle reconnection logic
4. Provide clean error messages
5. Track active sessions for debugging

One instance per backend service.
Creates new Deepgram connections per question, destroys after answer collected.

✅ IMPROVEMENTS:
- Better error recovery with exponential backoff
- Automatic cleanup of stale sessions
- Enhanced logging with context
- Session timeout detection
- Connection health monitoring
- Thread-safe active session tracking
"""

import asyncio
import websockets
import json
import logging
from typing import Optional, Tuple, Dict, List
from dataclasses import dataclass, field
from enum import Enum
import time
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)


class DeepgramConnectionState(Enum):
    """Track Deepgram connection state."""
    IDLE = "idle"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    CLOSED = "closed"
    FAILED = "failed"


@dataclass
class DeepgramConfig:
    """Configuration for Deepgram STT."""
    api_key: str
    ws_url: str = (
        "wss://api.deepgram.com/v1/listen"
        "?encoding=linear16"
        "&sample_rate=16000"
        "&channels=1"
        "&punctuate=true"
        "&model=nova-3"
        "&interim_results=true"
        "&endpointing=300"
        "&smart_format=true"
        "&keep_alive=true"
    )
    connection_timeout: float = 120.0
    ping_interval: int = 30
    ping_timeout: int = 3600
    # ✅ NEW: Configurable session parameters
    max_session_duration: float = 600.0  # 10 minutes max per question
    idle_timeout: float = 120.0  # 2 minutes of inactivity = timeout
    max_retries: int = 3
    retry_backoff: float = 1.0  # seconds, multiplied exponentially


class DeepgramConnectionError(Exception):
    """Custom exception for Deepgram connection failures."""
    pass


class DeepgramSessionTimeout(Exception):
    """Exception for session timeout."""
    pass


class DeepgramSession:
    """
    Represents a single Deepgram STT session for ONE question.
    
    Lifecycle:
    - Created fresh for each question
    - Audio streamed in via send()
    - Transcripts received via recv()
    - Closed explicitly when question ends
    
    ✅ IMPROVEMENTS:
    - Timeout detection (idle and absolute)
    - Better state tracking
    - Automatic cleanup
    - Enhanced diagnostics
    """

    def __init__(self, session_id: str, question_num: int, config: DeepgramConfig):
        self.session_id = session_id
        self.question_num = question_num
        self.config = config
        self.ws = None
        self.state = DeepgramConnectionState.IDLE
        self.created_at = time.time()
        self.last_activity = time.time()
        self.messages_sent = 0
        self.messages_received = 0
        self.final_transcript = None
        self.is_final = False
        # ✅ NEW: Track connection health
        self.connection_errors = 0
        self.last_error = None
        self.closed_remotely = False

    async def connect(self, retry_count: int = 0) -> bool:
        """
        Connect to Deepgram with automatic retry logic.
        
        Args:
            retry_count: Internal retry counter (do not set manually)
        
        Returns:
            True if successful, False otherwise
        """
        if self.state in (DeepgramConnectionState.CONNECTING, DeepgramConnectionState.CONNECTED):
            logger.warning(
                f"⚠️ [Q{self.question_num}] Already connecting/connected"
            )
            return self.state == DeepgramConnectionState.CONNECTED

        self.state = DeepgramConnectionState.CONNECTING
        logger.info(f"🔗 [Q{self.question_num}] Connecting to Deepgram STT...")
        logger.info(f"   URL: {self.config.ws_url[:80]}...")

        try:
            if not self.config.api_key:
                raise DeepgramConnectionError("DEEPGRAM_API_KEY not set")

            self.ws = await asyncio.wait_for(
                websockets.connect(
                    self.config.ws_url,
                    additional_headers={"Authorization": f"Token {self.config.api_key}"},
                    open_timeout=self.config.connection_timeout,
                    ping_interval=self.config.ping_interval,
                    ping_timeout=self.config.ping_timeout,
                ),
                timeout=self.config.connection_timeout,
            )

            self.state = DeepgramConnectionState.CONNECTED
            self.last_activity = time.time()
            self.connection_errors = 0
            logger.info(f"✅ [Q{self.question_num}] Deepgram connected (attempt {retry_count + 1})")
            return True

        except asyncio.TimeoutError:
            self.state = DeepgramConnectionState.FAILED
            self.connection_errors += 1
            self.last_error = f"Connection timeout ({self.config.connection_timeout}s)"
            
            logger.error(
                f"❌ [Q{self.question_num}] Connection timeout "
                f"({self.config.connection_timeout}s, attempt {retry_count + 1})"
            )
            
            # ✅ Retry logic with backoff
            if retry_count < self.config.max_retries:
                backoff = self.config.retry_backoff * (2 ** retry_count)
                logger.info(
                    f"🔄 [Q{self.question_num}] Retrying in {backoff:.1f}s "
                    f"({retry_count + 1}/{self.config.max_retries})"
                )
                await asyncio.sleep(backoff)
                return await self.connect(retry_count + 1)
            
            raise DeepgramConnectionError(
                f"Deepgram connection timeout after {self.config.connection_timeout}s "
                f"(failed {retry_count + 1} attempts)"
            )

        except websockets.exceptions.WebSocketException as e:
            self.state = DeepgramConnectionState.FAILED
            self.connection_errors += 1
            self.last_error = f"WebSocket error: {str(e)}"
            
            logger.error(f"❌ [Q{self.question_num}] WebSocket error: {e}")
            
            # ✅ Retry on WebSocket errors
            if retry_count < self.config.max_retries:
                backoff = self.config.retry_backoff * (2 ** retry_count)
                logger.info(
                    f"🔄 [Q{self.question_num}] Retrying WebSocket after {backoff:.1f}s"
                )
                await asyncio.sleep(backoff)
                return await self.connect(retry_count + 1)
            
            raise DeepgramConnectionError(f"WebSocket error: {str(e)}")

        except Exception as e:
            self.state = DeepgramConnectionState.FAILED
            self.connection_errors += 1
            self.last_error = f"Unexpected error: {str(e)}"
            
            logger.error(f"❌ [Q{self.question_num}] Unexpected error: {e}", exc_info=True)
            raise DeepgramConnectionError(f"Connection error: {str(e)}")

    async def send(self, data: bytes) -> bool:
        """
        Send PCM audio to Deepgram.
        
        Args:
            data: PCM audio bytes (16-bit, mono, 16kHz)
        
        Returns:
            True if successful, False if connection lost
        """
        if self.state != DeepgramConnectionState.CONNECTED:
            logger.warning(
                f"⚠️ [Q{self.question_num}] Cannot send: not connected "
                f"(state: {self.state.value})"
            )
            return False

        if not data:
            return True

        try:
            await self.ws.send(data)
            self.messages_sent += 1
            self.last_activity = time.time()
            
            if self.messages_sent % 50 == 0:  # Log every 50 messages to avoid spam
                logger.debug(
                    f"📤 [Q{self.question_num}] Sent {len(data)} bytes "
                    f"(total: {self.messages_sent})"
                )
            return True

        except websockets.exceptions.ConnectionClosed as e:
            self.state = DeepgramConnectionState.CLOSED
            self.closed_remotely = True
            logger.error(
                f"❌ [Q{self.question_num}] Connection closed while sending: {e}"
            )
            return False

        except Exception as e:
            logger.error(f"❌ [Q{self.question_num}] Send error: {e}")
            return False

    async def send_close_stream(self) -> bool:
        """
        Send CloseStream message to Deepgram.
        Signals end of audio input for this question.
        
        Returns:
            True if successful, False otherwise
        """
        if self.state != DeepgramConnectionState.CONNECTED:
            logger.debug(f"⚠️ [Q{self.question_num}] Not sending CloseStream: not connected")
            return False

        try:
            await self.ws.send(json.dumps({"type": "CloseStream"}))
            logger.info(f"📤 [Q{self.question_num}] CloseStream sent")
            return True

        except Exception as e:
            logger.warning(f"⚠️ [Q{self.question_num}] Error sending CloseStream: {e}")
            return False

    async def recv(self, timeout: Optional[float] = None) -> Optional[dict]:
        """
        Receive transcript message from Deepgram with timeout.
        
        Args:
            timeout: Override default idle timeout (seconds)
        
        Returns:
            Parsed JSON from Deepgram, or None if connection closed
        
        Raises:
            DeepgramConnectionError if message is malformed
            DeepgramSessionTimeout if idle timeout exceeded
        """
        if self.state not in (
            DeepgramConnectionState.CONNECTED,
            DeepgramConnectionState.CLOSED,
        ):
            return None

        try:
            if not self.ws:
                return None

            # ✅ Check absolute session timeout
            elapsed = time.time() - self.created_at
            if elapsed > self.config.max_session_duration:
                raise DeepgramSessionTimeout(
                    f"Session exceeded max duration ({self.config.max_session_duration}s)"
                )

            # ✅ Check idle timeout
            idle_time = time.time() - self.last_activity
            check_timeout = timeout or self.config.idle_timeout
            if idle_time > check_timeout:
                raise DeepgramSessionTimeout(
                    f"Session idle for {idle_time:.1f}s (max: {check_timeout}s)"
                )

            msg = await self.ws.recv()
            self.messages_received += 1
            self.last_activity = time.time()

            try:
                data = json.loads(msg)
                
                # ✅ Track final transcript
                if data.get("is_final"):
                    self.is_final = True
                    if "result" in data and data["result"].get("results"):
                        transcript = data["result"]["results"][0].get("alternatives", [{}])[0].get("transcript", "")
                        if transcript:
                            self.final_transcript = transcript
                            logger.info(
                                f"🎯 [Q{self.question_num}] Final transcript: {transcript[:100]}..."
                            )
                
                logger.debug(
                    f"📥 [Q{self.question_num}] Received {list(data.keys())} "
                    f"(total: {self.messages_received})"
                )
                return data

            except json.JSONDecodeError as e:
                logger.error(
                    f"❌ [Q{self.question_num}] JSON decode error: {e}"
                )
                raise DeepgramConnectionError(f"Invalid JSON from Deepgram: {e}")

        except websockets.exceptions.ConnectionClosed as e:
            if self.state != DeepgramConnectionState.CLOSED:
                self.state = DeepgramConnectionState.CLOSED
                self.closed_remotely = True
                logger.info(
                    f"🔌 [Q{self.question_num}] Deepgram closed "
                    f"(code: {e.rcvd.code if e.rcvd else 'unknown'}, "
                    f"reason: {e.rcvd.reason if e.rcvd else 'unknown'})"
                )
            return None

        except DeepgramSessionTimeout as e:
            logger.error(f"⏱️ [Q{self.question_num}] Session timeout: {e}")
            raise

        except asyncio.CancelledError:
            logger.debug(f"[Q{self.question_num}] Recv cancelled")
            raise

        except Exception as e:
            logger.error(f"❌ [Q{self.question_num}] Recv error: {e}", exc_info=True)
            raise

    async def close(self) -> None:
        """Close the Deepgram connection and log final stats."""
        if self.state == DeepgramConnectionState.CLOSED:
            logger.debug(f"[Q{self.question_num}] Already closed")
            return

        logger.info(f"🛑 [Q{self.question_num}] Closing Deepgram connection")

        if self.ws:
            try:
                await self.ws.close()
                logger.debug(f"✅ [Q{self.question_num}] WebSocket closed")
            except Exception as e:
                logger.warning(f"⚠️ [Q{self.question_num}] Error closing WebSocket: {e}")

        self.state = DeepgramConnectionState.CLOSED
        elapsed = time.time() - self.created_at
        logger.info(
            f"✅ [Q{self.question_num}] Deepgram session closed\n"
            f"    Duration: {elapsed:.1f}s\n"
            f"    Sent: {self.messages_sent} messages\n"
            f"    Received: {self.messages_received} messages\n"
            f"    Final transcript: {self.final_transcript or '(none)'}\n"
            f"    Closed remotely: {self.closed_remotely}"
        )

    def is_healthy(self) -> bool:
        """Check if session is healthy."""
        if self.state != DeepgramConnectionState.CONNECTED:
            return False
        
        # Check idle timeout
        idle_time = time.time() - self.last_activity
        if idle_time > self.config.idle_timeout:
            return False
        
        # Check absolute timeout
        elapsed = time.time() - self.created_at
        if elapsed > self.config.max_session_duration:
            return False
        
        return True

    def get_status(self) -> dict:
        """Return current session status."""
        elapsed = time.time() - self.created_at
        idle_time = time.time() - self.last_activity

        return {
            "question_num": self.question_num,
            "state": self.state.value,
            "elapsed_sec": round(elapsed, 1),
            "idle_sec": round(idle_time, 1),
            "messages_sent": self.messages_sent,
            "messages_received": self.messages_received,
            "is_healthy": self.is_healthy(),
            "final_transcript": self.final_transcript or "(pending)",
            "connection_errors": self.connection_errors,
            "last_error": self.last_error,
        }

    @asynccontextmanager
    async def managed_connection(self):
        """
        ✅ NEW: Async context manager for automatic cleanup.
        
        Usage:
            async with session.managed_connection():
                await session.send(audio_data)
                msg = await session.recv()
        """
        try:
            if not await self.connect():
                raise DeepgramConnectionError("Failed to connect")
            yield self
        finally:
            await self.close()


class DeepgramManager:
    """
    Factory for creating and managing Deepgram STT sessions.
    
    One instance per backend service.
    Creates fresh sessions on demand, no persistent connections.
    
    ✅ IMPROVEMENTS:
    - Thread-safe session tracking
    - Automatic stale session cleanup
    - Health monitoring
    - Better error recovery
    
    Usage:
        manager = DeepgramManager(api_key="...")
        
        # For each question:
        session = await manager.create_session(session_id, question_num)
        async with session.managed_connection():
            await session.send(pcm_bytes)
            transcript = await session.recv()
    """

    def __init__(self, api_key: str, config: Optional[DeepgramConfig] = None):
        self.api_key = api_key
        self.config = config or DeepgramConfig(api_key=api_key)
        self.active_sessions: Dict[int, DeepgramSession] = {}
        self._session_lock = asyncio.Lock()
        self.total_sessions_created = 0
        self.total_sessions_closed = 0
        logger.info("✅ DeepgramManager initialized")
        logger.info(f"   API key: {api_key[:20]}...")
        logger.info(f"   Max session duration: {self.config.max_session_duration}s")
        logger.info(f"   Idle timeout: {self.config.idle_timeout}s")

    async def create_session(
        self, session_id: str, question_num: int
    ) -> DeepgramSession:
        """
        Create a new Deepgram session for a question.
        
        Args:
            session_id: Interview session ID
            question_num: Question number
        
        Returns:
            DeepgramSession (not yet connected)
        """
        async with self._session_lock:
            logger.info(f"📋 Creating Deepgram session for Q{question_num}")

            session = DeepgramSession(session_id, question_num, self.config)
            self.active_sessions[question_num] = session
            self.total_sessions_created += 1
            
            logger.debug(
                f"   Active sessions: {len(self.active_sessions)} "
                f"(total created: {self.total_sessions_created})"
            )
            return session

    async def close_session(self, question_num: int) -> None:
        """
        Close a Deepgram session and remove from active tracking.
        
        Args:
            question_num: Question number
        """
        async with self._session_lock:
            if question_num not in self.active_sessions:
                logger.debug(f"⚠️ Session for Q{question_num} not found")
                return

            session = self.active_sessions.pop(question_num)
            await session.close()
            self.total_sessions_closed += 1
            logger.debug(f"   Active sessions now: {len(self.active_sessions)}")

    def get_session(self, question_num: int) -> Optional[DeepgramSession]:
        """
        Get an active session by question number.
        
        Returns:
            DeepgramSession or None if not found
        """
        return self.active_sessions.get(question_num)

    def list_active_sessions(self) -> List[dict]:
        """Return list of all active sessions with status."""
        return [
            session.get_status() for session in self.active_sessions.values()
        ]

    async def cleanup_stale_sessions(self) -> int:
        """
        ✅ NEW: Close unhealthy sessions.
        Useful for periodic maintenance.
        
        Returns:
            Number of sessions closed
        """
        async with self._session_lock:
            stale_sessions = [
                q_num for q_num, session in self.active_sessions.items()
                if not session.is_healthy()
            ]
            
            for q_num in stale_sessions:
                logger.warning(f"🧹 Closing stale session for Q{q_num}")
                try:
                    await self.active_sessions[q_num].close()
                    self.active_sessions.pop(q_num)
                    self.total_sessions_closed += 1
                except Exception as e:
                    logger.warning(f"⚠️ Error closing Q{q_num}: {e}")
            
            if stale_sessions:
                logger.info(f"✅ Cleaned up {len(stale_sessions)} stale sessions")
            
            return len(stale_sessions)

    async def close_all_sessions(self) -> None:
        """
        Close all active sessions (emergency cleanup).
        Useful on session timeout or error recovery.
        """
        async with self._session_lock:
            if not self.active_sessions:
                logger.debug("No active sessions to close")
                return

            logger.warning(
                f"🧹 Closing all {len(self.active_sessions)} Deepgram sessions"
            )

            for question_num in list(self.active_sessions.keys()):
                try:
                    await self.active_sessions[question_num].close()
                    self.total_sessions_closed += 1
                except Exception as e:
                    logger.warning(
                        f"⚠️ Error closing Q{question_num}: {e}"
                    )

            self.active_sessions.clear()
            logger.info("✅ All Deepgram sessions closed")

    def get_health_status(self) -> dict:
        """Return comprehensive health status."""
        return {
            "active_sessions": len(self.active_sessions),
            "total_created": self.total_sessions_created,
            "total_closed": self.total_sessions_closed,
            "sessions": self.list_active_sessions(),
        }


# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL SINGLETON
# ─────────────────────────────────────────────────────────────────────────────

_manager_instance: Optional[DeepgramManager] = None


def init_deepgram_manager(api_key: str, config: Optional[DeepgramConfig] = None) -> DeepgramManager:
    """
    Initialize the global DeepgramManager instance.
    Call once on app startup.
    
    Args:
        api_key: Deepgram API key
        config: Optional custom config
    
    Returns:
        The initialized manager
    
    Example:
        from fastapi import FastAPI
        
        app = FastAPI()
        
        @app.on_event("startup")
        async def startup():
            init_deepgram_manager(api_key=os.getenv("DEEPGRAM_API_KEY"))
        
        @app.on_event("shutdown")
        async def shutdown():
            manager = get_deepgram_manager()
            await manager.close_all_sessions()
    """
    global _manager_instance
    _manager_instance = DeepgramManager(api_key, config)
    return _manager_instance


def get_deepgram_manager() -> DeepgramManager:
    """
    Get the global DeepgramManager instance.
    
    Returns:
        The manager (must be initialized first with init_deepgram_manager)
    
    Raises:
        RuntimeError if not initialized
    """
    if _manager_instance is None:
        raise RuntimeError(
            "DeepgramManager not initialized. "
            "Call init_deepgram_manager() on app startup."
        )
    return _manager_instance