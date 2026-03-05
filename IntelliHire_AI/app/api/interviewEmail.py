import httpx
from fastapi import APIRouter

router = APIRouter()

NODE_BASE = "http://localhost:8000"

@router.post("/api/resumes/schedule/{batch_id}")
async def schedule(batch_id: str, payload: dict):
    # payload: { interviews: [...] }
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"{NODE_BASE}/api/interview/send-interview-emails",
            json=payload
        )
        r.raise_for_status()
        return r.json()