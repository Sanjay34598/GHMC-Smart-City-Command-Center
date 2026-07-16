"""Service layer for coordinating the LLM workflow."""
import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.llm.gemini_client import GeminiClient
from app.llm.models import AgentResponse, LLMAnalysis
from app.llm.prompt_builder import build_emergency_prompt
from app.modules.analyses.repository import AnalysisRepository
from app.modules.incidents.models import Incident
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self, db: Session):
        self.db = db
        self.client = GeminiClient()
        self.analysis_repo = AnalysisRepository(db)
        
    def generate_summary(self, incident: Incident) -> LLMAnalysis:
        """Generates an LLM summary for the given incident."""
        
        # Check if one already exists
        existing = self.db.query(LLMAnalysis).filter(LLMAnalysis.incident_id == incident.id).first()
        if existing:
            return existing
            
        # Get YOLO detections
        latest_analysis = self.analysis_repo.get_latest_by_incident(incident.id)
        detections = latest_analysis.prediction_json.get("detections", []) if latest_analysis and latest_analysis.prediction_json else []
        
        # Build prompt
        prompt = build_emergency_prompt(
            description=incident.description,
            severity=incident.severity,
            category=incident.category,
            detections=detections,
            latitude=incident.latitude,
            longitude=incident.longitude
        )
        
        # Call LLM
        parsed_result, response_time, token_usage = self.client.generate_emergency_assessment(prompt)
        
        # Persist
        llm_analysis = LLMAnalysis(
            incident_id=incident.id,
            provider="gemini",
            model=settings.GEMINI_MODEL_NAME,
            prompt_version="v1",
            summary=parsed_result.summary,
            risk_level=parsed_result.risk_level,
            recommendations=parsed_result.recommended_actions,
            services=parsed_result.required_services,
            warning=parsed_result.public_warning,
            response_time=response_time,
            token_usage=token_usage
        )
        
        self.db.add(llm_analysis)
        self.db.commit()
        self.db.refresh(llm_analysis)
        
        return llm_analysis
        
    def get_summary(self, incident_id: str) -> LLMAnalysis:
        """Retrieves an existing summary."""
        existing = self.db.query(LLMAnalysis).filter(LLMAnalysis.incident_id == incident_id).first()
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No AI summary found for this incident."
            )
        return existing

    def simulate_multi_agent_coordination(self, incident: Incident) -> list[AgentResponse]:
        # Clear existing for demo purposes
        self.db.query(AgentResponse).filter(AgentResponse.incident_id == incident.id).delete()
        
        agents = [
            AgentResponse(
                incident_id=incident.id,
                agent_type="Disaster Assessment Agent",
                status="completed",
                payload={
                    "disaster_type": incident.category,
                    "confidence": "95%",
                    "affected_area": "2.5 sq km radius"
                }
            ),
            AgentResponse(
                incident_id=incident.id,
                agent_type="Risk Assessment Agent",
                status="completed",
                payload={
                    "risk_level": incident.severity,
                    "potential_casualties": "Estimated 5-15",
                    "property_damage": "High structural damage likely",
                    "infrastructure_impact": "Power lines affected"
                }
            ),
            AgentResponse(
                incident_id=incident.id,
                agent_type="Emergency Coordinator Agent",
                status="completed",
                payload={
                    "recommended_agencies": ["Fire Department", "Ambulance", "Police"]
                }
            ),
            AgentResponse(
                incident_id=incident.id,
                agent_type="Public Advisory Agent",
                status="completed",
                payload={
                    "citizen_warning": "Stay indoors and avoid affected areas.",
                    "evacuation_message": "Prepare for immediate evacuation if sirens sound.",
                    "safety_precautions": "Keep emergency kits ready.",
                    "travel_advisory": "Avoid Main Street and 5th Avenue."
                }
            ),
            AgentResponse(
                incident_id=incident.id,
                agent_type="Resource Planning Agent",
                status="completed",
                payload={
                    "fire_trucks": 4,
                    "ambulances": 6,
                    "police_units": 3,
                    "medical_staff": 12,
                    "rescue_teams": 2
                }
            )
        ]
        
        for agent in agents:
            self.db.add(agent)
            
        self.db.commit()
        for agent in agents:
            self.db.refresh(agent)
            
        return agents
        
    def get_coordination_status(self, incident_id: str) -> list[AgentResponse]:
        return self.db.query(AgentResponse).filter(AgentResponse.incident_id == incident_id).all()
