import asyncio
from dataclasses import dataclass, field
from typing import Dict, Optional, Callable, Any
from aiortc import RTCPeerConnection
from .tts.tts_track import QueueAudioTrack
import logging

logger = logging.getLogger(__name__)

@dataclass
class LiveSession:
    session_id: str
    pc: RTCPeerConnection
    stt_queue: asyncio.Queue
    tts_queue: asyncio.Queue
    tts_audio_track: QueueAudioTrack
    interview_session_id: str = None
    tts_track_attached: bool = False
    closed: bool = False
    deepgram_started: bool = False
    track_handler_added: bool = False


class SessionManager:
    """Manages WebRTC peer connections and associated queues for live sessions."""
    
    # Queue size constants (consider making these configurable)
    STT_QUEUE_SIZE = 900000
    TTS_QUEUE_SIZE = 800000
    
    def __init__(self):
        self._sessions: Dict[str, LiveSession] = {}
        self._lock = asyncio.Lock()

    async def create_or_get(
        self, 
        *, 
        session_id: str,
        # interview_session_id: str,
        pc_factory: Callable[[], RTCPeerConnection]
    ) -> LiveSession:
        """
        Create a new session or retrieve an existing one.
        
        Args:
            session_id: Unique identifier for the live session
            interview_session_id: Associated interview session ID
            pc_factory: Callable that creates an RTCPeerConnection instance
            
        Returns:
            LiveSession instance
        """
        async with self._lock:
            sess = self._sessions.get(session_id)
            if sess and not sess.closed:
                return sess

            pc = pc_factory()
            tts_queue = asyncio.Queue(maxsize=self.TTS_QUEUE_SIZE)
            tts_audio_track = QueueAudioTrack(tts_queue)

            sess = LiveSession(
                session_id=session_id,
                # interview_session_id=interview_session_id,
                pc=pc,
                stt_queue=asyncio.Queue(maxsize=self.STT_QUEUE_SIZE),
                tts_queue=tts_queue,
                tts_audio_track=tts_audio_track
            )
            self._sessions[session_id] = sess
            # logger.info(f"Created new session: {session_id} (interview: {interview_session_id})")
            return sess

    async def get(self, session_id: str) -> Optional[LiveSession]:
        """Retrieve a session by ID without modification."""
        async with self._lock:
            return self._sessions.get(session_id)

    async def close(self, session_id: str) -> bool:
        """
        Close a session and clean up resources.
        
        Args:
            session_id: Session to close
            
        Returns:
            True if session was closed, False if already closed or not found
        """
        async with self._lock:
            sess = self._sessions.get(session_id)
            if not sess or sess.closed:
                return False
            sess.closed = True
            
            # Store reference and remove from dict to prevent leaks
            removed_session = self._sessions.pop(session_id)
            logger.info(f"Closing session: {session_id}")

        # Cleanup outside lock to avoid blocking other operations
        sess = removed_session
        
        # Unblock queues
        try:
            sess.tts_queue.put_nowait(None)
            sess.stt_queue.put_nowait(None)
            logger.info(f"Sent end-of-stream signals for session: {session_id}")
        except asyncio.QueueFull:
            logger.warning(f"Queue full when signaling end-of-stream for {session_id}, draining first")
            # Attempt to drain queue if full
            try:
                while not sess.tts_queue.empty():
                    sess.tts_queue.get_nowait()
                while not sess.stt_queue.empty():
                    sess.stt_queue.get_nowait()
                sess.tts_queue.put_nowait(None)
                sess.stt_queue.put_nowait(None)
            except Exception as e:
                logger.error(f"Error draining queues for {session_id}: {e}")
        except Exception as e:
            logger.error(f"Error sending end-of-stream for {session_id}: {e}")

        # Close PeerConnection safely
        try:
            if sess.pc and sess.pc.connectionState != "closed":
                await sess.pc.close()
                logger.info(f"Closed PeerConnection for session: {session_id}")
        except Exception as e:
            logger.error(f"Error closing PeerConnection for {session_id}: {e}")

        return True

    async def list_active(self) -> list[str]:
        """Get list of active (non-closed) session IDs."""
        async with self._lock:
            return [sid for sid, sess in self._sessions.items() if not sess.closed]

    async def cleanup_closed(self) -> int:
        """
        Remove closed sessions from tracking (manual cleanup).
        Useful if you want periodic garbage collection.
        
        Returns:
            Number of sessions cleaned up
        """
        async with self._lock:
            closed_ids = [sid for sid, sess in self._sessions.items() if sess.closed]
            for sid in closed_ids:
                del self._sessions[sid]
            if closed_ids:
                logger.info(f"Cleaned up {len(closed_ids)} closed sessions")
            return len(closed_ids)


# Global singleton instance
session_manager = SessionManager()