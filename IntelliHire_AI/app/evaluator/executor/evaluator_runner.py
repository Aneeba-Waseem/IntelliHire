import json
from typing import Dict, Any

from app.evaluator.llm.api_client import HuggingFaceLLMClient
from app.evaluator.llm.prompt_builder import EvaluatorPromptBuilder
from app.evaluator.executor.validator import validate_evaluator_output
from app.evaluator.llm.errors import LLMError
from app.evaluator.scoring.score_updater import clamp_delta
from app.evaluator.utils.turn_logger import log_turn_result


class EvaluatorRunner:
    def __init__(self, rubric: Dict[str, Any]):
        self.llm = HuggingFaceLLMClient()
        self.rubric = rubric

    async def evaluate_turn(
        self,
        *,
        input_event: Dict[str, Any],
        max_attempts: int = 2,
    ) -> Dict[str, Any]:

        prompt = EvaluatorPromptBuilder.build(
            input_event=input_event,
            rubric=self.rubric,
        )

        last_error = None

        for attempt in range(max_attempts + 1):
            try:
                raw_output = await self.llm.generate(prompt)
                print(f"🔴 RAW LLM OUTPUT:\n{repr(raw_output)}\n")
                parsed = json.loads(raw_output)

                validate_evaluator_output(parsed)

                raw_delta = parsed.get("delta", {})
                print(f"✅Raw delta from LLM: {raw_delta}")
                # Quantize delta to allowed values
                sanitized_delta = clamp_delta(parsed.get("delta", {}))
                print(f"✅Sanitized delta after clamping: {sanitized_delta}")
                parsed["delta"] = sanitized_delta

                # Calculate question score (0-5 scale)
                # Three dimensions sum to 0-5 marks
                delta_values = list(sanitized_delta.values())
                question_score = sum(delta_values) * (5 / 3)
                question_score = round(min(question_score, 5), 2)

                # Derive quality label
                if question_score >= 4:
                    quality_label = "strong"
                elif question_score >= 2.5:
                    quality_label = "ok"
                else:
                    quality_label = "weak"

                # Log turn result
                log_turn_result(
                    input_event=input_event,
                    delta=sanitized_delta,
                    quality=quality_label,
                    updated_scorecard=None,
                    notes=parsed["notes"],
                )

                return {
                    "delta": parsed["delta"],
                    "notes": parsed["notes"],
                    "signals": parsed["signals"],
                    "response_quality": quality_label,
                    "question_score": question_score,
                }

            except (json.JSONDecodeError, ValueError) as e:
                last_error = e
                prompt = self._repair_prompt(prompt)

            except LLMError as e:
                raise e

        raise RuntimeError(f"Evaluator failed after retries: {last_error}")

    @staticmethod
    def _repair_prompt(original_prompt: str) -> str:
        return (
            original_prompt
            + "\n\n"
            + "PREVIOUS OUTPUT WAS INVALID.\n"
            + "Return ONLY valid JSON matching the required schema.\n"
            + "DO NOT include explanations or markdown.\n"
        )