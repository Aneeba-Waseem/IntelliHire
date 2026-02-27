# fastapi_openai.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import time
from openai import OpenAI

import os
from fastapi import APIRouter
router = APIRouter()
# --------------------
# FastAPI App
# --------------------
# app = FastAPI(title="OpenAI/Groq Interview API")

# --------------------
# Request & Response Models
# --------------------
class GenerateRequest(BaseModel):
    prompt: str
    model: str = "openai/gpt-oss-20b"  # default model

class GenerateResponse(BaseModel):
    output_text: str
    time_taken: float

# --------------------
# OpenAI Client (lazy initializer)
# --------------------
_client = None

def get_openai_client():
    global _client
    if _client is not None:
        return _client

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY not set in environment. Set it before calling the Groq/OpenAI endpoints."
        )

    _client = OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
    return _client

# --------------------
# API Endpoint
# --------------------
@router.post("/chat", response_model=GenerateResponse)
async def generate_text(req: GenerateRequest):
    try:
        start_time = time.time()
        client = get_openai_client()
        response = client.responses.create(
            input=req.prompt,
            model=req.model,
        )
        end_time = time.time()
        return {
            "output_text": response.output_text,
            "time_taken": end_time - start_time
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))