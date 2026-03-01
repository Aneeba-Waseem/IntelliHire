import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..realtime.session_manager import session_manager
from ..realtime.tts.elevenlabs_stream import elevenlabs_pcm_stream

router = APIRouter()


class SpeakRequest(BaseModel):
    session_id: str
    text: str


@router.post("/speak")
async def speak(req: SpeakRequest):

    session_id = req.session_id.strip()
    text = req.text.strip()

    print(f"[TTS] /speak called")
    print(f"[TTS] Incoming session_id: {session_id}")
    print(f"[TTS] Text length: {len(text)}")

    if not session_id:
        print("[TTS] ERROR: session_id missing")
        raise HTTPException(status_code=400, detail="session_id is required")

    if not text:
        print("[TTS] ERROR: text empty")
        raise HTTPException(status_code=400, detail="text is empty")

    # Get existing WebRTC session
    sess = await session_manager.get(session_id)

    if not sess:
        print(f"[TTS] ERROR: session {session_id} not found in SessionManager")
    elif sess.closed:
        print(f"[TTS] ERROR: session {session_id} is closed")

    if not sess or sess.closed:
        raise HTTPException(
            status_code=404,
            detail="WebRTC session not found. Call /webrtc/offer first."
        )

    print(f"[TTS] Session found: {session_id}")
    print(f"[TTS] Queue size before streaming: {sess.tts_queue.qsize()}")

    async def _stream_into_queue():
        print(f"[TTS] Background stream started for session {session_id}")

        chunk_count = 0
        total_bytes = 0

        try:
            async for pcm_chunk in elevenlabs_pcm_stream(text):
                chunk_count += 1
                total_bytes += len(pcm_chunk)

                print(
                    f"[TTS] Chunk {chunk_count} | size={len(pcm_chunk)} | queue={sess.tts_queue.qsize()}"
                )

                try:
                    sess.tts_queue.put_nowait(pcm_chunk)
                except asyncio.QueueFull:
                    print("[TTS] WARNING: queue full, dropping chunk")

            # 🔧 IMPORTANT: add 500ms silence so last words are not cut
            silence = b"\x00\x00" * int(22050 * 0.5)

            print(f"[TTS] Adding silence tail | size={len(silence)}")

            try:
                sess.tts_queue.put_nowait(silence)
            except asyncio.QueueFull:
                print("[TTS] WARNING: queue full, silence dropped")

            print(
                f"[TTS] Completed for session {session_id} | chunks={chunk_count} | bytes={total_bytes}"
            )

        except Exception as e:
            print("❌ TTS stream error:", e)

    # Run streaming in background (non-blocking)
    asyncio.create_task(_stream_into_queue())

    print(f"[TTS] Response returned, streaming continues in background")

    return {
        "ok": True,
        "session_id": session_id,
        "message": "TTS streaming started"
    }