from datetime import datetime
from pydantic import BaseModel, ConfigDict

class LLMAnalysisResponse(BaseModel):
    """API response model for LLM emergency assessments."""
    id: str
    incident_id: str
    provider: str
    model: str
    summary: str
    risk_level: str
    recommendations: list[str]
    services: list[str]
    warning: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class AgentStatusUpdate(BaseModel):
    id: str
    incident_id: str
    agent_type: str
    status: str
    payload: dict | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CoordinationResponse(BaseModel):
    incident_id: str
    agents: list[AgentStatusUpdate]
