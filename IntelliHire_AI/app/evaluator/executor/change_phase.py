# from typing import Dict, Any


# def should_stop(scorecard: Dict[str, Any]) -> bool:
#     """
#     Decide whether the interview should stop based on score stability.
#     """

#     metadata = scorecard.get("metadata", {})

#     score = sum(
#         float(d["current"])
#         for d in scorecard["dimensions"].values()
#     )

#     turn_count = metadata.get("turn_count", 0)
#     deltas = metadata.get("recent_deltas", [])

#     # --- Rule 1: saturation (strong or very weak) ---
#     if score >= 4.5:
#         return True

#     if score <= 0.5 and turn_count >= 4:
#         return True

#     # --- Rule 2: stability ---
#     if len(deltas) >= 3:
#         recent = deltas[-3:]
#         if max(recent) <= 0.25 and sum(recent) < 0.5:
#             return True

#     return False