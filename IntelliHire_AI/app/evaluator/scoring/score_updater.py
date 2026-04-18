import re
from typing import Dict, Any
from app.evaluator.scoring.utils import clamp

def clamp_delta(delta: Dict[str, float]) -> Dict[str, float]:
    """
    Force allowed discrete values:
    0.5 = strong
    0.25 = partial
    0.0 = incorrect
    """
    sanitized = {}

    for k, v in delta.items():
        try:
            v = float(v)
        except:
            v = 0.0

        # Quantization - fixed thresholds
        if v >= 0.75:      # 0.4+ → 0.5
            v = 1.0
        elif v >= 0.3:   # 0.15-0.39 → 0.25
            v = 0.5
        else:             # <0.15 → 0.0
            v = 0.0

        sanitized[k] = v

    return sanitized

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