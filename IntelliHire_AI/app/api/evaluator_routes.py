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


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(req: EvaluateRequest):
    try:
        # Ensure we pass plain JSON-serializable dicts to the runner
        input_event = jsonable_encoder(req.input_event)
        scorecard = jsonable_encoder(req.scorecard)
        print("in the evaluation route, input_event is ", input_event)
        # Ensure `candidate_answer` and `answer` are present for downstream logic
        if not input_event.get("candidate_answer"):
            input_event["candidate_answer"] = input_event.get("answer")

        if not input_event.get("answer") and input_event.get("candidate_answer"):
            input_event["answer"] = input_event.get("candidate_answer")

        result = await runner.evaluate_turn(input_event=input_event, scorecard=scorecard)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    