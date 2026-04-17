import json
from typing import Dict, Any

from app.evaluator.llm.api_client import HuggingFaceLLMClient
from app.evaluator.llm.prompt_builder import EvaluatorPromptBuilder
from app.evaluator.executor.validator import validate_evaluator_output
from app.evaluator.llm.errors import LLMError
from app.evaluator.scoring.score_updater import apply_delta
# from app.evaluator.scoring.post_processing import apply_backend_rules  # or backend_rules
from app.evaluator.utils.turn_logger import log_turn_result

class EvaluatorRunner:
    def __init__(self, rubric: Dict[str, Any]):
        self.llm = HuggingFaceLLMClient()
        self.rubric = rubric

    async def evaluate_turn(
        self,
        *,
        input_event: Dict[str, Any],
        scorecard: Dict[str, Any],
        max_attempts: int = 2,
    ) -> Dict[str, Any]:

        prompt = EvaluatorPromptBuilder.build(
            input_event=input_event,
            scorecard=scorecard,
            rubric=self.rubric,
        )

        last_error = None

        for attempt in range(max_attempts + 1):
            try:
                raw_output = await self.llm.generate(prompt)
                parsed = json.loads(raw_output)

                validate_evaluator_output(parsed)

                # ✅ Apply backend rules (quantize + semantic guard)
                sanitized_delta = apply_backend_rules(
                    parsed.get("delta", {}),
                    candidate_answer=input_event.get("answer", ""),
                    ideal_answer=input_event.get("ideal_answer", ""),
                )

                # overwrite so returned delta/logs are correct
                parsed["delta"] = sanitized_delta

                # ---- overall response quality (per turn) ----
                delta_values = list(sanitized_delta.values())
                question_score_raw = sum(delta_values)
                question_max_raw = len(delta_values) * 0.5

                question_score = (
                    (question_score_raw / question_max_raw) * 5
                    if question_max_raw > 0 else 0
                )

                # derive quality from report scale (0–5)
                if question_score >= 4:
                    quality_label = "strong"
                elif question_score >= 2.5:
                    quality_label = "average"
                else:
                    quality_label = "weak"

                # ---- Apply delta to scorecard ----
                authoritative_scorecard = apply_delta(
                    current_scorecard=scorecard,
                    delta=sanitized_delta,
                )

                log_turn_result(
                input_event=input_event,
                delta=sanitized_delta,
                quality=quality_label,
                updated_scorecard=authoritative_scorecard,
                notes=parsed["notes"],
                )
                
                return {
                    "updated_scorecard": authoritative_scorecard,
                    "delta": parsed["delta"],
                    "notes": parsed["notes"],
                    "signals": parsed["signals"],
                    "response_quality": quality_label,
                    "question_score": round(question_score,2)
                }

            except (json.JSONDecodeError, ValueError) as e:
                last_error = e
                prompt = self._repair_prompt(prompt, raw_output)

            except LLMError as e:
                raise e

        raise RuntimeError(f"Evaluator failed after retries: {last_error}")

    @staticmethod
    def _repair_prompt(original_prompt: str, bad_output: str) -> str:
        return (
            original_prompt
            + "\n\n"
            + "PREVIOUS OUTPUT WAS INVALID.\n"
            + "Return ONLY valid JSON matching the required schema.\n"
            + "DO NOT include explanations or markdown.\n"
        )