"""Pydantic schemas and parsers for LLM structured output."""
import json
from typing import List
from pydantic import BaseModel, Field

class LLMResponseSchema(BaseModel):
    """The structured JSON expected from the LLM."""
    summary: str = Field(description="A brief description of the emergency situation.")
    risk_level: str = Field(description="The risk level, e.g., Critical, High, Medium, Low.")
    recommended_actions: List[str] = Field(description="List of recommended actions to take.")
    required_services: List[str] = Field(description="List of emergency services needed.")
    public_warning: str = Field(description="A warning message for the public.")

def parse_llm_json(raw_text: str) -> LLMResponseSchema:
    """Parse and validate JSON returned by the LLM."""
    try:
        # Strip potential markdown code blocks (e.g. ```json ... ```)
        cleaned = raw_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        
        data = json.loads(cleaned)
        return LLMResponseSchema(**data)
    except Exception as e:
        raise ValueError(f"Failed to parse LLM JSON: {e}")

def get_fallback_response() -> LLMResponseSchema:
    """Return a safe fallback response if the LLM fails completely."""
    return LLMResponseSchema(
        summary="Automated analysis temporarily unavailable.",
        risk_level="Unknown",
        recommended_actions=["Await further instructions", "Exercise caution in the area"],
        required_services=["Emergency Services Dispatch"],
        public_warning="System is analyzing the situation. Follow local authority guidance."
    )
