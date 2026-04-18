import json
import re
from typing import Dict, Any, List


class EvaluatorPromptBuilder:
    @staticmethod
    def extract_key_concepts(ideal_answer: str) -> List[str]:
        """
        Extract key technical concepts from ideal answer.
        Uses sentence-level parsing to identify distinct claims/concepts.
        """
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', ideal_answer.strip())
        
        # Filter out very short sentences and extract meaningful concepts
        concepts = []
        for sent in sentences:
            sent = sent.strip()
            if len(sent) > 15 and sent:  # Only substantial sentences
                concepts.append(sent)
        
        # Limit to 5-6 core concepts
        return concepts[:6]

    @staticmethod
    def build(
        *,
        input_event: Dict[str, Any],
        rubric: Dict[str, Any],   
    ) -> str:
        """
        Dynamic evaluator prompt for Qwen2-7B.
        Extracts key concepts from ideal answer to enforce completeness checking.
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
        
        # Extract key concepts dynamically
        key_concepts = EvaluatorPromptBuilder.extract_key_concepts(ideal_answer)
        concepts_text = "\n".join(
            f"{i+1}. {concept}" for i, concept in enumerate(key_concepts)
        )

        rules = rubric.get("rules", [])

        # Format dimension descriptions
        dimension_text = "\n".join(
            f"- {name.upper()}: {info['description']} (max: {info['max_score']})"
            for name, info in dimensions.items()
        )
        
        rules_text = "\n".join(f"- {r}" for r in rules)

        scale_text = (
            f"1.0 = comprehensive (covers 4+ key concepts with depth) → full credit\n"
            f"0.5 = partial (covers 2-3 key concepts OR covers 4+ but lacks depth) → half credit\n"
            f"0.0 = weak (covers <2 concepts, major errors, or unrelated) → no credit"
        )

        example_json = """
        EXAMPLE 1 (Full Credit - All Key Concepts):
        """ + json.dumps({
            "delta": {
                "understanding": 1.0,
                "correctness": 1.0,
                "relevance": 1.0
            },
            "notes": ["Candidate answer covers all 5 key concepts from the ideal answer with technical depth. No errors or significant omissions."],
            "signals": {
                "candidate_struggling": False
            }
        }, indent=2) + """

        EXAMPLE 2 (Partial Credit - Missing Key Concepts):
        """ + json.dumps({
            "delta": {
                "understanding": 0.5,
                "correctness": 1.0,
                "relevance": 0.5
            },
            "notes": ["Candidate correctly explained 2-3 key concepts but omitted important technical details (e.g., responsive design, structure vs. presentation separation). What was stated is accurate, but coverage is incomplete."],
            "signals": {
                "candidate_struggling": False
            }
        }, indent=2) + """

        EXAMPLE 3 (Weak - Major Omissions or Errors):
        """ + json.dumps({
            "delta": {
                "understanding": 0.5,
                "correctness": 0.5,
                "relevance": 0.5
            },
            "notes": ["Candidate mentioned only surface-level concepts (rows/columns) without explaining mechanism, comparisons, or advantages. Lacks technical depth and misses most key concepts from ideal answer."],
            "signals": {
                "candidate_struggling": False
            }
        }, indent=2)

        return f"""You are a fair technical interviewer evaluating candidate answers.

            Domain: {domain}

            INSTRUCTIONS:
            - Compare CANDIDATE ANSWER against IDEAL ANSWER for technical accuracy and completeness.
            - Ignore spelling, grammar, typos—evaluate TECHNICAL CONCEPTS ONLY.
            - Identify how many of the KEY CONCEPTS the candidate covered with understanding.
            - Do NOT award 1.0 unless candidate demonstrates depth on 4+ key concepts.
            - Return ONLY valid JSON. No text outside JSON.
            - Use ONLY delta values: 1.0, 0.5, 0.0

            DIMENSIONS:
            {dimension_text}

            DELTA SCALE (based on concept coverage):
            {scale_text}

            RULES:
            {rules_text}

            KEY CONCEPTS IN IDEAL ANSWER (for completeness checking):
            {concepts_text}

            EVALUATION CRITERIA:
            - UNDERSTANDING: Does candidate explain HOW/WHY the technology works? (1.0 = explains 4+ concepts with depth; 0.5 = explains 2-3 concepts OR explains 4+ but superficially; 0.0 = misses core mechanisms)
            - CORRECTNESS: Are statements factually accurate? (1.0 = all accurate; 0.5 = mostly accurate but minor errors/oversimplifications; 0.0 = major technical errors)
            - RELEVANCE: Does candidate address all aspects of the question? (1.0 = addresses question fully with 4+ key points; 0.5 = partial coverage of 2-3 key aspects; 0.0 = misses the question)

            CRITICAL GUIDANCE:
            - A candidate answer that conveys the SAME technical meaning as ideal but with fewer words = still needs to hit 4+ key concepts to score 1.0.
            - Surface-level correctness (e.g., "Grid has rows and columns") without explaining comparisons, mechanisms, or advantages = 0.5 for UNDERSTANDING and RELEVANCE.
            - Only award 1.0 if the candidate demonstrates technical DEPTH on most key concepts.
            - Award 0.5 when candidate has the right ideas but is missing critical details or only covers partial scope.

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
        
        # Validate delta values are only 0.0, 0.5, or 1.0
        valid_values = {0.0, 0.5, 1.0}
        for dim, value in delta.items():
            if value not in valid_values:
                raise ValueError(
                    f"Invalid delta value for {dim}: {value}. Must be 0.0, 0.5, or 1.0"
                )

        # Validate candidate_struggling logic
        all_zero = all(v == 0.0 for v in delta.values())
        if data["signals"]["candidate_struggling"] != all_zero:
            # Warn but allow correction
            data["signals"]["candidate_struggling"] = all_zero

        return data