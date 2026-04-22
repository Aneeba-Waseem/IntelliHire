# # aggregator.py
# from typing import Dict, Any
# from evaluator.aggregation.normalizer import normalize


# def aggregate_scorecard(
#     scorecard: Dict[str, Any]
# ) -> Dict[str, Any]:
#     """
#     Produces an aggregated, normalized view of the interview.
#     """

#     dimension_scores = {}
#     total_current = 0.0
#     total_max = 0.0

#     for dim_name, dim_data in scorecard["dimensions"].items():
#         current = float(dim_data["current"])
#         max_value = float(dim_data["max"])

#         dimension_scores[dim_name] = {
#             "raw": current,
#             "max": max_value,
#             "normalized": normalize(current, max_value),
#         }

#         total_current += current
#         total_max += max_value

#     overall = {
#         "raw": total_current,
#         "max": total_max,
#         "normalized": normalize(total_current, total_max),
#     }

#     return {
#         "by_dimension": dimension_scores,
#         "overall": overall,
#         "metadata": scorecard.get("metadata", {}),
#     }
