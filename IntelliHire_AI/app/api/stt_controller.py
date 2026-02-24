# api/stt_controller.py
from fastapi import APIRouter
from pydantic import BaseModel
from aiortc import RTCPeerConnection, RTCSessionDescription
import asyncio

from ..STT.webrtc_handler import stream_audio
from ..STT.deepgram_client import run_deepgram

router = APIRouter()

class OfferRequest(BaseModel):
    sdp: str
    type: str

@router.post("/offer")
async def stt_offer(body: OfferRequest):
    pc = RTCPeerConnection()
    audio_queue = asyncio.Queue()

    @pc.on("track")
    def on_track(track):
        if track.kind == "audio":
            asyncio.create_task(stream_audio(track, audio_queue))

    asyncio.create_task(run_deepgram(audio_queue))

    await pc.setRemoteDescription(RTCSessionDescription(body.sdp, body.type))
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return {
        "sdp": pc.localDescription.sdp,
        "type": pc.localDescription.type
    }