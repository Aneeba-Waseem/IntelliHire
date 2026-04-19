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

class ConvAnalysisRequest(BaseModel):
    question: str
    answer: str
    model: str = "openai/gpt-oss-20b"
class ConvAnalysisResponse(BaseModel):
    decision: str
    followUpText: str | None = None

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
    
@router.post("/conversational-analysis", response_model=ConvAnalysisResponse)
async def conversational_analysis(req: ConvAnalysisRequest):
    try:
        client = get_openai_client()

        prompt = f"""
You are an interview evaluation classifier.

Your job is to analyze a candidate's answer and decide the correct response category.

----------------------------------------------------
CATEGORIES:

1. "submit"
- The candidate has answered the question completely and correctly, OR
- The candidate clearly does not know the answer and gives up
- Examples:
  - "I don't know"
  - "No idea"
  - "I haven't learned this yet"
- No follow-up question is required

2. "further_explanation"
- The candidate shows partial understanding
- Answer is incomplete, shallow, or missing key reasoning
- The candidate is attempting the question but needs deeper explanation or follow-up

3. "clarification_request"
- The candidate is confused about the question itself
- They are NOT attempting to answer
- Examples:
  - "I don't understand the question"
  - "What does this mean?"
  - "Can you explain the question?"
  - "Please clarify"

----------------------------------------------------
STRICT RULES:

- Be strict but fair in evaluation
- DO NOT confuse:
  - confusion about the question → clarification_request
  - incorrect answer → further_explanation or submit (depending on effort)
- If the candidate is asking what the question means → ALWAYS "clarification_request"
- If the candidate attempts an answer → NEVER classify as "clarification_request"
- If answer is complete or clearly given up → "submit"

----------------------------------------------------
FOLLOW-UP RULES:

- Only "further_explanation" and "clarification_request" generate follow-ups
- Follow-ups must be:
  - short
  - natural
  - single question only
- If "clarification_request":
  → rephrase the original question in simpler terms
- If "further_explanation":
  → ask for deeper detail or missing reasoning
- If "submit":
  → followUpText MUST be null

----------------------------------------------------
OUTPUT RULES:

- Output MUST be valid JSON only
- No extra text, no explanation, no markdown

----------------------------------------------------
OUTPUT FORMAT:

{{
  "decision": "submit | further_explanation | clarification_request",
  "followUpText": "string or null"
}}

----------------------------------------------------
INPUT:

QUESTION:
{req.question}

CANDIDATE ANSWER:
{req.answer}
"""

        response = client.responses.create(
            model=req.model,
            input=prompt,
        )

        import json
        raw = response.output_text.strip()
        print("[ConvLLM RAW]:", raw)

        try:
            data = json.loads(raw)
        except Exception:
            return {
                "decision": "submit",
                "followUpText": None
            }

        decision = data.get("decision", "submit")

        # -----------------------------
        # CLEAN HANDLING
        # -----------------------------
        if decision == "clarification_request":
            return {
                "decision": "clarification_request",
                "followUpText": data.get(
                    "followUpText",
                    "No worries — let me explain it differently. What part is unclear?"
                )
            }

        if decision == "further_explanation":
            return {
                "decision": "further_explanation",
                "followUpText": data.get(
                    "followUpText",
                    "Could you go a bit deeper on that?"
                )
            }

        return {
            "decision": "submit",
            "followUpText": None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))