"""Prompt templates for LLM Emergency Intelligence."""
import json
from typing import Optional

def build_emergency_prompt(
    description: str,
    severity: str,
    category: str,
    detections: list,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None
) -> str:
    """Build a structured prompt to send to the LLM."""
    detections_str = json.dumps(detections, indent=2) if detections else "None"
    
    location_str = f"Lat: {latitude}, Lng: {longitude}" if latitude is not None and longitude is not None else "Unknown"
    
    prompt = f"""
You are an expert AI Emergency Dispatch Coordinator.
Analyze the following emergency incident and provide a structured assessment.

INCIDENT DETAILS:
Category: {category}
Reported Severity: {severity}
Location: {location_str}
Description: {description}

AI DETECTIONS (From YOLO Vision Model):
{detections_str}

Based on this information, provide an emergency assessment.
You MUST output ONLY valid JSON using the following structure:
{{
  "summary": "Brief 1-2 sentence overview of the situation",
  "risk_level": "Critical, High, Medium, or Low",
  "recommended_actions": ["Action 1", "Action 2"],
  "required_services": ["Service 1", "Service 2"],
  "public_warning": "Warning message for civilians"
}}

Ensure no markdown formatting or extra text outside the JSON object is returned.
"""
    return prompt
