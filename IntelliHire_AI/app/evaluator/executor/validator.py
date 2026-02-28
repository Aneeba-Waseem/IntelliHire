from typing import Dict, Any


REQUIRED_TOP_LEVEL_KEYS = {
    # "updated_scorecard",
    "delta",
    "notes",
    "signals",
}


def validate_evaluator_output(data: Dict[str, Any]) -> None:
    if not isinstance(data, dict):
        raise ValueError("Evaluator output is not a JSON object")

    missing = REQUIRED_TOP_LEVEL_KEYS - data.keys()
    if missing:
        raise ValueError(f"Missing required keys: {missing}")

    # if not isinstance(data["updated_scorecard"], dict):
    #     raise ValueError("updated_scorecard must be an object")

    if not isinstance(data["delta"], dict):
        raise ValueError("delta must be an object")

    if not isinstance(data["notes"], list):
        raise ValueError("notes must be a list")

    if not isinstance(data["signals"], dict):
        raise ValueError("signals must be an object")
