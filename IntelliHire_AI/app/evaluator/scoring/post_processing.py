import re
from typing import Dict


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

        # Quantization
        if v >= 0.6:
            v = 0.5
        elif v >= 0.2:
            v = 0.25
        else:
            v = 0.0

        sanitized[k] = v

    return sanitized