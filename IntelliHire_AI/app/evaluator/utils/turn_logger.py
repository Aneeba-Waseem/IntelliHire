import json
import os
from datetime import datetime


def log_turn_result(
    *,
    input_event,
    delta,
    quality,
    updated_scorecard,
    notes,
):
    interview_id = input_event.get("interview_id", "unknown")
    turn_index = input_event.get("turn_index", 0)

    os.makedirs("outputs", exist_ok=True)
    file_path = f"outputs/interview_{interview_id}.jsonl"

    record = {
        "timestamp": datetime.utcnow().isoformat(),
        "turn_index": turn_index,
        "question_id": input_event.get("question_id"),
        "domain": input_event.get("domain"),
        "question": input_event.get("question-text"),
        "answer": input_event.get("candidate_answer"),
        "delta": delta,
        "response_quality": quality,
        "notes": notes,
        "scorecard": updated_scorecard,
    }

    with open(file_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")