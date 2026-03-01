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

@router.post("/generate-context")
async def generate_context(req: GenerateRequest):
    print("Request received:",  req.json())  # only if using raw Request
    try:
        client = get_openai_client()

        prompt = f"""
{req.prompt}

in 4-5 words of technical context only.
"""
        print("Generated prompt for context:", prompt)

        response = client.responses.create(
            model=req.model,
            input=prompt,
        )

        print("context:", response.output_text.strip())

        return {
            "context": response.output_text.strip()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/convert-question")
async def convert_question(req: GenerateRequest):
    try:
        client = get_openai_client()

        prompt = f"""
You are an experienced technical interviewer continuing an ongoing interview conversation.

Your task:
Rewrite the question in a natural conversational tone so it feels like a smooth continuation of discussion.

Guidelines:
- Use light conversational fillers occasionally (e.g., "hmm", "okay", "ahan", "got it", "alright").
- Do NOT use greetings (no "Hi", "Hello", "Good morning", etc.).
- Do NOT sound formal or robotic.
- Do NOT overuse slang — keep it professional and natural.
- Keep the question clear and concise.
- It should feel like the interviewer is continuing the discussion after the candidate’s previous answer.
- Ask only the question. No extra explanations.

Original Question:
{req.prompt}

Return only the rewritten conversational question.
"""

        response = client.responses.create(
            model=req.model,
            input=prompt,
        )
        print("message:", response.output_text.strip())

        return {
            "message": response.output_text.strip()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))