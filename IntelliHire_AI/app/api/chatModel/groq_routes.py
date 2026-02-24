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
# OpenAI Client Setup
# --------------------
client = OpenAI(
   api_key=os.getenv("OPENAI_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

# --------------------
# API Endpoint
# --------------------
@router.post("/chat", response_model=GenerateResponse)
async def generate_text(req: GenerateRequest):
    try:
        start_time = time.time()
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