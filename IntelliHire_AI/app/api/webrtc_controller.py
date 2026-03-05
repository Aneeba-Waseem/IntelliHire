from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.sdp import candidate_from_sdp
from ..realtime.session_manager import session_manager
from ..realtime.tts.elevenlabs_stream import elevenlabs_pcm_stream
from ..realtime.STT.deepgram_client import connect_deepgram
from ..realtime.STT.deepgram_stream import stream_audio

router = APIRouter()

@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    sess = await session_manager.create_or_get(session_id=session_id, pc_factory=RTCPeerConnection)
    pc = sess.pc

    if not sess.track_handler_added:
        @pc.on("track")
        async def on_track(track):
            if track.kind != "audio":
                return
            asyncio.create_task(stream_audio(track, sess.stt_queue))
        sess.track_handler_added = True

    @pc.on("icecandidate")
    async def on_icecandidate(candidate):
        if candidate and websocket.application_state == "connected":
            await websocket.send_json({
                "type": "ice",
                "candidate": {
                    "candidate": candidate.to_sdp(),
                    "sdpMid": candidate.sdpMid,
                    "sdpMLineIndex": candidate.sdpMLineIndex
                }
            })

    if not sess.tts_track_attached:
        pc.addTrack(sess.tts_audio_track)
        sess.tts_track_attached = True

    if not sess.deepgram_started:
        sess.deepgram_started = True
        asyncio.create_task(connect_deepgram(sess.stt_queue, websocket, session_id))

    try:
        while True:
            data = await websocket.receive_json()
            if data["type"] == "offer":
                await pc.setRemoteDescription(RTCSessionDescription(sdp=data["sdp"], type="offer"))
                answer = await pc.createAnswer()
                await pc.setLocalDescription(answer)
                await websocket.send_json({"type": "answer", "sdp": pc.localDescription.sdp})

            elif data["type"] == "ice":
                candidate = data.get("candidate")
                if candidate:
                    ice = candidate_from_sdp(candidate["candidate"])
                    ice.sdpMid = candidate["sdpMid"]
                    ice.sdpMLineIndex = candidate["sdpMLineIndex"]
                    await pc.addIceCandidate(ice)

            elif data["type"] == "tts":
                text = data.get("text", "").strip()
                if text:
                    async def stream_tts():
                        try:
                            async for pcm in elevenlabs_pcm_stream(text):
                                try:
                                    sess.tts_queue.put_nowait(pcm)
                                except asyncio.QueueFull:
                                    print("⚠️ TTS queue full")
                        except Exception as e:
                            print("TTS error:", e)
                    asyncio.create_task(stream_tts())

    except WebSocketDisconnect:
        print(f"Client disconnected: {session_id}")
        await session_manager.close(session_id)

    except Exception as e:
        print(f"WebSocket error: {e}")
        await session_manager.close(session_id)
        if websocket.application_state != "closed":
            await websocket.close(code=1011)