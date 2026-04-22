from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


class InputEvent(BaseModel):
    interview_id: str
    question_id: str
    domain: str
    question_text: str
    candidate_answer: str
    ideal_answer: Optional[str] = None
    turn_index: int
    timestamp: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Dimension(BaseModel):
    current: float
    max: float


class Scorecard(BaseModel):
    dimensions: Dict[str, Dimension]
    by_domain: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class EvaluateRequest(BaseModel):
    input_event: Dict[str, Any]
    scorecard: Dict[str, Any] = {}  # Optional, defaults to empty dict


class EvaluateResponse(BaseModel):
    delta: Dict[str, float]
    notes: List[str]
    signals: Dict[str, Any]
    response_quality: str
    question_score: float
