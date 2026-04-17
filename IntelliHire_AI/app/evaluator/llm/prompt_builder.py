import json
from typing import Dict, Any


class EvaluatorPromptBuilder:
    @staticmethod
    def build(
        *,
        input_event: Dict[str, Any],
        rubric: Dict[str, Any],   
    ) -> str:
        """
        Lightweight prompt optimized for Qwen2-7B with few-shot examples.
        """

        question = input_event.get("question_text", "")
        candidate_answer = input_event.get("candidate_answer", "")
        ideal_answer = input_event.get("ideal_answer", "") 
        domain = input_event.get("domain", "general")


        if not input_event.get("ideal_answer"):
            raise ValueError("ideal_answer required in input_event")

        dimensions = rubric.get("dimensions", {})
        if not dimensions:
            raise ValueError("Rubric must contain at least one dimension")
        
        # Extract from rubric
        rules = rubric.get("rules", [])

        # Format dimension descriptions
        dimension_text = "\n".join(
            f"- {name.upper()}: {info['description']} (max: {info['max_score']})"
            for name, info in dimensions.items()
        )
        
        rules_text = "\n".join(f"- {r}" for r in rules)

        scale_text = (
            f"0.5 = strong (main concept present) -> full credit\n"
            f"0.25 = partial (some understanding, missing key parts) -> half credit\n"
            f"0.0 = weak (incorrect or unrelated) -> no credit"
        )

        # Few-shot example
        example_json = json.dumps({
            "delta": {
                "understanding": 0.5,
                "correctness": 0.25,
                "relevance": 0.5
            },
            "notes": ["Candidate understood the core concept but made a critical technical error in implementation details. Answer was mostly on-topic."],
            "signals": {
                "candidate_struggling": False
            }
        }, indent=2)

        return f"""You are a fair technical interviewer evaluating candidate answers.

                Domain: {domain}

                INSTRUCTIONS:
                - Evaluate based on meaning and concepts, NOT exact wording.
                - Return ONLY valid JSON. No text outside JSON.
                - Use ONLY delta values: 0.5, 0.25, 0.0
                - Notes: single concise string (2-3 sentences max)
                - candidate_struggling: true ONLY if ALL delta values are 0.0

                DIMENSIONS:
                {dimension_text}

                DELTA SCALE:
                {scale_text}

                RULES:
                {rules_text}

                QUESTION:
                {json.dumps(question)}

                IDEAL ANSWER:
                {json.dumps(ideal_answer)}

                CANDIDATE ANSWER:
                {json.dumps(candidate_answer)}

                EXAMPLE OUTPUT:
                {example_json}

                Return JSON only (no markdown, no extra text):"""

    @staticmethod
    def validate_response(response: str) -> Dict[str, Any]:
        """
        Validate and parse evaluator response.
        """
        try:
            data = json.loads(response)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON response: {response}") from e

        # Validate required fields
        if "delta" not in data or "notes" not in data or "signals" not in data:
            raise ValueError(f"Missing required fields in response: {data}")

        delta = data["delta"]
        # Ensure notes is always a list
        if not isinstance(data.get("notes"), list):
            data["notes"] = [str(data.get("notes", ""))]
        
        # Validate delta values are only 0.0, 0.25, or 0.5
        valid_values = {0.0, 0.25, 0.5}
        for dim, value in delta.items():
            if value not in valid_values:
                raise ValueError(
                    f"Invalid delta value for {dim}: {value}. Must be 0.0, 0.25, or 0.5"
                )

        # Validate candidate_struggling logic
        all_zero = all(v == 0.0 for v in delta.values())
        if data["signals"]["candidate_struggling"] != all_zero:
            # Warn but allow correction
            data["signals"]["candidate_struggling"] = all_zero

        return data