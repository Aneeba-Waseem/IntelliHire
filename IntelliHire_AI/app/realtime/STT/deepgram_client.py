import asyncio
import json
import websockets
import os
import httpx
import numpy as np
from dotenv import load_dotenv
from ...core.config import NODE_TRANSCRIPT_URL

load_dotenv()

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
DEEPGRAM_WS_URL = (
    "wss://api.deepgram.com/v1/listen"
    "?encoding=linear16"
    "&sample_rate=16000"
    "&channels=1"
    "&interim_results=true"
    "&punctuate=true"
    "&model=nova-3"
)

async def send_to_node(session_id, text):
    if not NODE_TRANSCRIPT_URL:
        return
    try:
        async with httpx.AsyncClient(timeout=200) as client:
            await client.post(
                NODE_TRANSCRIPT_URL,
                json={"session_id": session_id, "text": text}
            )
    except Exception as e:
        print("❌ Node webhook error:", e)

def generate_silence(duration_sec=0.5, sample_rate=16000):
    """
    Generate linear16 PCM silence bytes for Deepgram.
    """
    num_samples = int(duration_sec * sample_rate)
    silence = np.zeros(num_samples, dtype=np.int16)
    return silence.tobytes()

async def connect_deepgram(audio_queue: asyncio.Queue, websocket, session_id: str):
    """
    Connect to Deepgram, stream audio from queue, send silence if idle.
    """
    deepgram_ws = await websockets.connect(
        DEEPGRAM_WS_URL,
        additional_headers={"Authorization": f"Token {DEEPGRAM_API_KEY}"},
        open_timeout=500,
        ping_interval=20
    )
    print(f"✅ Deepgram connected for session {session_id}")

    async def send_to_deepgram():
        last_audio_time = asyncio.get_event_loop().time()
        keep_alive_interval = 5  # seconds

        while True:
            try:
                chunk = await asyncio.wait_for(audio_queue.get(), timeout=1.0)
                if chunk is None:
                    break
                await deepgram_ws.send(chunk)
                last_audio_time = asyncio.get_event_loop().time()
            except asyncio.TimeoutError:
                if asyncio.get_event_loop().time() - last_audio_time > keep_alive_interval:
                    await deepgram_ws.send(generate_silence())
                    last_audio_time = asyncio.get_event_loop().time()
            except websockets.exceptions.ConnectionClosed:
                break
            except Exception as e:
                print(f"Error in send_to_deepgram: {e}")
                break

    async def receive_from_deepgram():
        try:
            async for msg in deepgram_ws:
                data = json.loads(msg)
                if "channel" in data:
                    alt = data["channel"]["alternatives"][0]
                    text = alt.get("transcript", "")
                    if text and data.get("is_final"):
                        print(f"🟢 FINAL [{session_id}]: {text}")
                        await websocket.send_json({"type": "transcript", "text": text})
                        await send_to_node(session_id, text)
        except websockets.exceptions.ConnectionClosed:
            print(f"Deepgram WS closed for session {session_id}")

    asyncio.create_task(send_to_deepgram())
    asyncio.create_task(receive_from_deepgram())

    return deepgram_ws