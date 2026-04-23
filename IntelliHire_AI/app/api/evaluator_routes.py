import asyncio
import os
import json
from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder

from app.models.evaluator import EvaluateRequest, EvaluateResponse
from app.evaluator.executor.evaluator_runner import EvaluatorRunner

router = APIRouter()

# load rubric
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rubric_path = os.path.join(BASE_DIR, "evaluator", "config", "rubric.json")
with open(rubric_path, "r", encoding="utf-8") as f:
    rubric = json.load(f)

runner = EvaluatorRunner(rubric=rubric)


async def retry_async(func, retries=3, delay=1, backoff=2, exceptions=(Exception,)):
    last_exception = None
    for attempt in range(retries):
        try:
            return await func()
        except exceptions as e:
            last_exception = e
            if attempt < retries - 1:
                sleep_time = delay * (backoff ** attempt)
                print(f"Retry {attempt+1}/{retries} failed. Retrying in {sleep_time}s...")
                await asyncio.sleep(sleep_time)
            else:
                raise last_exception


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(req: EvaluateRequest):
    try:
        input_event = jsonable_encoder(req.input_event)

        # normalize
        input_event["question-text"] = input_event.get("question-text") or input_event.get("question")
        input_event["candidate_answer"] = input_event.get("candidate_answer") or input_event.get("answer")

        print("in the evaluation route, input_event is ", input_event)

        async def run():
            return await runner.evaluate_turn(input_event=input_event)

        result = await retry_async(run, retries=3, delay=1, backoff=2)
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))