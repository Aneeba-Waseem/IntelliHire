import asyncio
from dataclasses import dataclass
from typing import Dict, Optional
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
    tts_track_attached: bool = False
    closed: bool = False
    deepgram_started: bool = False
    track_handler_added: bool = False

class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, LiveSession] = {}
        self._lock = asyncio.Lock()

    async def create_or_get(self, *, session_id: str, pc_factory) -> LiveSession:
        async with self._lock:
            sess = self._sessions.get(session_id)
            if sess and not sess.closed:
                return sess

            pc = pc_factory()
            tts_queue = asyncio.Queue(maxsize=800000)
            tts_audio_track = QueueAudioTrack(tts_queue)

            sess = LiveSession(
                session_id=session_id,
                pc=pc,
                stt_queue=asyncio.Queue(maxsize=900000),
                tts_queue=tts_queue,
                tts_audio_track=tts_audio_track
            )
            self._sessions[session_id] = sess
            logger.info(f"Created new session: {session_id}")
            return sess

    async def get(self, session_id: str) -> Optional[LiveSession]:
        async with self._lock:
            return self._sessions.get(session_id)

    async def close(self, session_id: str) -> bool:
        async with self._lock:
            sess = self._sessions.get(session_id)
            if not sess or sess.closed:
                return False
            sess.closed = True
            logger.info(f"Closing session: {session_id}")

        # Unblock queues
        try:
            sess.tts_queue.put_nowait(None)
            sess.stt_queue.put_nowait(None)
            logger.info(f"Sent end-of-stream signals for session: {session_id}")
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

session_manager = SessionManager()
