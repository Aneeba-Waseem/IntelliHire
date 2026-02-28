import json
from typing import Dict, Any


class EvaluatorPromptBuilder:
    @staticmethod
    def build(
        *,
        input_event: Dict[str, Any],
        scorecard: Dict[str, Any],
        rubric: Dict[str, Any],   
    ) -> str:
        """
        Lightweight prompt optimized for Qwen2-1.5B
        """

        question = input_event.get("question", "")
        candidate_answer = input_event.get("answer", "")
        ideal_answer = input_event.get("ideal_answer", "")
        domain = input_event.get("domain", "general")

        # ---- Extract from rubric ----
        dimensions = rubric["dimensions"]
        rules = rubric["rules"]
        scale = rubric["delta_scale"]

        # Make readable text
        dimension_text = "\n".join(
            f"- {name}: {info['description']}"
            for name, info in dimensions.items()
        )
        rules_text = "\n".join(f"- {r}" for r in rules)

        scale_text = (
            f"{scale['strong']} = strong\n"
            f"{scale['partial']} = partial\n"
            f"{scale['weak']} = incorrect"
        )

        return f"""
            System:
            You are a fair technical interviewer.

            Evaluate the candidate answer semantically.
            Match meaning and concepts, not exact wording.

            Return VALID JSON only.
            No text outside JSON.
            Notes must always be an array of strings. The length of notes hsould not exceed 2-3 senetences.

            User:
            Domain: {domain}

            Evaluate the candidate answer.

            Question:
            {question}

            Ideal Answer:
            {ideal_answer}

            Candidate Answer:
            {candidate_answer}

            Scoring values (use ONLY these):
            {scale_text}

            Do NOT use any other numbers.
            Do NOT give negative values.
            Be strict.
            Full score requires most key concepts from the ideal answer.
            Incorrect technical statements must reduce the correctness to 0.
            Donot give positive feeback for incorrect concepts. 
            
            Dimensions: 
            {dimension_text}
            
            Rules:
            {rules_text}

            Return JSON only:
            {{
                "delta": {{
                    "understanding": number,
                    "correctness": number,
                    "relevance": number
                }},
                "notes": ["short reason"],
                "signals": {{
                    "candidate_struggling": true/false
                }}
            }}
            """.strip()