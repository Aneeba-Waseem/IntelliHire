from typing import Dict

def normalize(value: float, max_value: float) -> float:
    """
    Normalizes score to range 0 → 1
    """
    if max_value <= 0:
        return 0.0
    return round(value / max_value, 4)