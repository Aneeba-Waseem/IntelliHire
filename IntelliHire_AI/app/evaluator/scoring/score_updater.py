from typing import Dict, Any
from app.evaluator.scoring.utils import clamp

def apply_delta(
    *,
    delta: Dict[str, float],
) -> Dict[str, float]:
    """
    Convert delta (0.0, 0.25, 0.5) to scores.
    Three dimensions sum to 0-5 marks per question.
    """
    scores = {}
    for dim_name, delta_value in delta.items():
        score = delta_value * (5 / 3)
        scores[dim_name] = clamp(score, 0, 5)  # Safety ceiling per dimension
    
    total = clamp(sum(scores.values()), 0, 5)
    return {
        "dimensions": scores,
        "total_score": total
    }