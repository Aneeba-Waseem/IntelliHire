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
    return token and len(token) > 10


async def run_tts(text: str, sess):
    """Stream TTS audio into the session TTS queue."""
    try:
        async for pcm in deepgram_pcm_stream(text):
            logger.info(f"TTS PCM chunk: {len(pcm)} bytes")
            try:
                await sess.tts_queue.put(pcm)
            except asyncio.QueueFull:
                logger.warning("TTS queue full, dropping chunk")
            except Exception as e:
                logger.error(f"TTS queue error: {e}")
    except Exception as e:
        logger.error(f"Deepgram TTS error: {e}")


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str = None):
    await websocket.accept()

    try:
        # ─────────────────────────────────────────────
        # Step 1: Auth
        # ─────────────────────────────────────────────
        first = await websocket.receive()

        if "text" not in first:
            await websocket.close(code=1008, reason="Expected auth JSON")
            return

        try:
            data = json.loads(first["text"])
        except Exception:
            await websocket.close(code=1008, reason="Invalid JSON")
            return

        if data.get("type") != "auth":
            await websocket.close(code=1008, reason="First message must be auth")
            return

        token = data.get("token")
        if not token or not is_valid_token(token):
            await websocket.close(code=1008, reason="Unauthorized")
            return

        # ─────────────────────────────────────────────
        # Step 2: Session
        # ─────────────────────────────────────────────
        if not session_id:
            session_id = str(uuid.uuid4())
            await websocket.send_json(
                {"type": "session_id", "session_id": session_id}
            )

        sess = await session_manager.create_or_get(
            session_id=session_id,
            pc_factory=RTCPeerConnection
        )

        pc = sess.pc

        # ─────────────────────────────────────────────
        # Step 3: WebRTC track → STT
        # ─────────────────────────────────────────────
        if not sess.track_handler_added:

            @pc.on("track")
            async def on_track(track):
                if track.kind == "audio":
                    logger.info(f"🎧 Received audio track: {track.id}")
                    asyncio.create_task(
                        stream_audio(track, sess.stt_queue)
                    )

            sess.track_handler_added = True

        # ─────────────────────────────────────────────
        # Step 4: ICE candidates
        # ─────────────────────────────────────────────
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
                except Exception:
                    pass

        # ─────────────────────────────────────────────
        # Step 5: Start Deepgram STT
        # ─────────────────────────────────────────────
        if not sess.deepgram_started:
            sess.deepgram_started = True
            asyncio.create_task(
                connect_deepgram(sess.stt_queue, websocket, session_id)
            )

        # ─────────────────────────────────────────────
        # Step 6: WebSocket message loop
        # ─────────────────────────────────────────────
        while True:

            message = await websocket.receive()

            # Ignore binary frames
            if "bytes" in message:
                continue

            if "text" not in message:
                continue

            try:
                data = json.loads(message["text"])
            except Exception:
                logger.warning("Invalid JSON message")
                continue

            msg_type = data.get("type")

            if not msg_type:
                logger.warning("Message missing type")
                continue

            # ───────────────── OFFER ─────────────────
            if msg_type == "offer":

                await pc.setRemoteDescription(
                    RTCSessionDescription(
                        sdp=data["sdp"],
                        type="offer"
                    )
                )

                logger.info("Received WebRTC offer")

                # Attach TTS track BEFORE answer
                if not sess.tts_track_attached:
                    pc.addTrack(sess.tts_audio_track)
                    sess.tts_track_attached = True
                    logger.info("🔊 TTS track attached")

                answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)

                logger.info("Created WebRTC answer")

                await websocket.send_json({
                    "type": "answer",
                    "sdp": pc.localDescription.sdp
                })

            # ───────────────── ICE ─────────────────
            elif msg_type == "ice":

                candidate = data.get("candidate")

                if candidate:
                    ice = candidate_from_sdp(
                        candidate["candidate"]
                    )

                    ice.sdpMid = candidate["sdpMid"]
                    ice.sdpMLineIndex = candidate["sdpMLineIndex"]

                    await pc.addIceCandidate(ice)

            # ───────────────── TTS ─────────────────
            elif msg_type in ("question", "tts"):

                text = data.get("text", "").strip()

                if text:
                    logger.info(f"🗣️ TTS request: {text[:50]}")
                    asyncio.create_task(run_tts(text, sess))

            else:
                logger.warning(f"Unknown message type: {msg_type}")

    except WebSocketDisconnect:
        logger.info(f"Client disconnected: {session_id}")
        await session_manager.close(session_id)

    except Exception as e:
        logger.error(f"WebSocket error: {e}")

        await session_manager.close(session_id)

        try:
            await websocket.close(code=1011)
        except Exception:
            pass