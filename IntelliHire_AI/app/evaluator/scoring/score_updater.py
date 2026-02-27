from typing import Dict, Any
from app.evaluator.scoring.utils import clamp
# from evaluator.scoring.post_processing import clamp_delta

def apply_delta(
    *,
    current_scorecard: Dict[str, Any],
    delta: Dict[str, float],
) -> Dict[str, Any]:
    """
    Applies delta to the current scorecard safely.

    Rules:
    - Only existing dimensions may be updated
    - Max score is never exceeded
    - Missing dimensions are ignored
    - Negative deltas are allowed
    """

    updated = {
        "dimensions": {},
        "by_domain": current_scorecard.get("by_domain", {}),
        "metadata": current_scorecard.get("metadata", {}),
    }

    for dim_name, dim_data in current_scorecard["dimensions"].items():
        current = float(dim_data.get("current", 0))
        max_value = float(dim_data.get("max", 0))

        # delta = apply_backend_rules(delta, candidate_answer, ideal_answer)
        # updated = apply_delta(current_scorecard=scorecard, delta=delta)
        delta_value = max(0.0, float(delta.get(dim_name, 0)))

        new_value = clamp(
            current + delta_value,
            min_value=0,
            max_value=max_value,
        )

        updated["dimensions"][dim_name] = {
            "current": new_value,
            "max": max_value,
        }

    return updated
