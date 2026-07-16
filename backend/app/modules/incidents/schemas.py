from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class IncidentCategory(StrEnum):
    FIRE = "Fire"
    FLOOD = "Flood"
    EARTHQUAKE = "Earthquake"
    ROAD_ACCIDENT = "Road Accident"
    BUILDING_COLLAPSE = "Building Collapse"
    LANDSLIDE = "Landslide"
    GARBAGE = "Garbage Overflow"
    POTHOLES = "Potholes"
    WATER_LEAK = "Water Leakage"
    SEWAGE = "Sewage Overflow"
    STREETLIGHT = "Broken Streetlight"
    OTHER = "Other"


class EmergencyLevel(StrEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    category: IncidentCategory
    severity: EmergencyLevel
    latitude: float
    longitude: float
    image_path: str
    status: str
    is_civic_issue: bool
    ward: str | None
    department: str | None
    estimated_resolution: str | None
    created_at: datetime
    updated_at: datetime


class IncidentUpdateStatus(BaseModel):
    status: str
