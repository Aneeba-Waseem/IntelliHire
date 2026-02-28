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

# -------------------------------------------------
# 2) Lightweight semantic overlap (NOT keyword match)
# -------------------------------------------------
def semantic_overlap(candidate: str, ideal: str) -> float:
    """
    Measures concept overlap using word intersection.
    This is semantic enough for short technical answers
    without forcing exact keywords.
    """

    candidate_words = set(
        re.findall(r"\b[a-zA-Z]{3,}\b", candidate.lower())
    )

    ideal_words = set(
        re.findall(r"\b[a-zA-Z]{3,}\b", ideal.lower())
    )

    if not ideal_words:
        return 0.0

    overlap = len(candidate_words & ideal_words)
    return overlap / len(ideal_words)

# -------------------------------------------------
# 3) Evidence grounding guard (prevents hallucination)
# -------------------------------------------------
def evidence_guard(delta: Dict[str, float], overlap: float) -> Dict[str, float]:
    """
    If semantic overlap is very low,
    correctness cannot be strong.
    """

    # If almost no concept overlap
    if overlap < 0.1:
        delta["correctness"] = min(delta.get("correctness", 0), 0.25)
        delta["understanding"] = min(delta.get("understanding", 0), 0.25)

    return delta

# -------------------------------------------------
# 4) Main backend rule pipeline
# -------------------------------------------------
def apply_backend_rules(
    delta: Dict[str, float],
    candidate_answer: str,
    ideal_answer: str,
) -> Dict[str, float]:
    """
    Applies all backend business rules:
    1) Quantize values
    2) Semantic grounding
    3) Prevent hallucinated full credit
    """

    # Step 1 — clamp to allowed values
    delta = clamp_delta(delta)

    # Step 2 — semantic overlap
    overlap = semantic_overlap(candidate_answer, ideal_answer)

    # Step 3 — grounding guard
    delta = evidence_guard(delta, overlap)

    return delta
        
# def extract_key_terms(text: str):
#     """
#     Extract important technical terms from ideal answer.
#     Simple heuristic:
#     - Acronyms (SMB, TCP, REST)
#     - Capitalized technical words
#     """
#     # Acronyms (SMB, HTTP, CNN, etc.)
#     acronyms = re.findall(r'\b[A-Z]{2,}\b', text)

#     # Capitalized words (optional, lightweight)
#     capitalized = re.findall(r'\b[A-Z][a-zA-Z]+\b', text)

#     return set([t.lower() for t in acronyms + capitalized])


# def contains_key_terms(candidate: str, ideal: str) -> bool:
#     key_terms = extract_key_terms(ideal)
#     candidate_lower = candidate.lower()

#     for term in key_terms:
#         if term in candidate_lower:
#             return True

#     return False
