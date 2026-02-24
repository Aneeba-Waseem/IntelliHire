from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
import os
import json
import time

# --------------------------------------------------
# Router (instead of separate FastAPI app)
# --------------------------------------------------
router = APIRouter()

# --------------------------------------------------
# Globals (loaded once)
# --------------------------------------------------
model = None
tokenizer = None
device = "cuda" if torch.cuda.is_available() else "cpu"

# --------------------------------------------------
# Model Path
# --------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
model_path = os.path.join(BASE_DIR, "qna_Model", "FinetunedMistral")

# --------------------------------------------------
# 4-bit Quantization (for 8GB GPU)
# --------------------------------------------------
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4"
)

# --------------------------------------------------
# Load Model ONLY ONCE (when module loads)
# --------------------------------------------------
def load_model_once():
    global model, tokenizer
    if model is not None:
        return

    print("🔄 Loading Mistral model (4-bit)...")

    tokenizer = AutoTokenizer.from_pretrained(model_path, use_fast=False)
    tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        quantization_config=bnb_config,
        device_map="auto",
        offload_folder="offload"
    )
    model.eval()
    print("✅ Mistral model loaded into GPU")


# Load immediately at import
# load_model_once()

# --------------------------------------------------
# Request / Response Schemas
# --------------------------------------------------
class GenerateRequest(BaseModel):
    topic: str
    difficulty: str


class QuestionData(BaseModel):
    question: str
    ideal_answer: str


class GenerateResponse(BaseModel):
    data: List[QuestionData]


# --------------------------------------------------
# Prompt Builder
# --------------------------------------------------
def build_prompt(context: str, difficulty: str) -> str:
    instruction = (
        f"Given the Topic and Difficulty below, generate a single interview question "
        f"and its ideal answer. Return ONLY valid JSON in this exact structure:\n"
        '{ "data":[ {"question":"string", "ideal_answer":"string"} ] }\n\n'
        f"Topic: {context}\n"
        f"Difficulty: {difficulty}\n"
    )
    return f"<s>[INST] {instruction} [/INST]"


# --------------------------------------------------
# API Endpoint
# --------------------------------------------------
@router.post("/generate-question", response_model=GenerateResponse)
async def generate_question(req: GenerateRequest):

    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    prompt_text = build_prompt(req.topic, req.difficulty)

    try:
        inputs = tokenizer(prompt_text, return_tensors="pt").to(device)

        start = time.time()

        with torch.no_grad():
            generated_ids = model.generate(
                **inputs,
                max_new_tokens=200,
                temperature=0.0,
                do_sample=False,
                eos_token_id=tokenizer.eos_token_id
            )

        end = time.time()
        print(f"Inference time: {end - start:.2f}s")

        # Remove prompt tokens
        output_tokens = generated_ids[0][inputs.input_ids.shape[1]:]
        output_text = tokenizer.decode(output_tokens, skip_special_tokens=True)

        data = json.loads(output_text.strip())
        return data

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Model output is not valid JSON")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))