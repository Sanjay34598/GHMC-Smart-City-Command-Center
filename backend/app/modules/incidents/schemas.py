from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class IncidentCategory(StrEnum):
    ROAD_BLOCK = "Road Block"
    ACCIDENT = "Accident"
    FLOOD = "Flood"
    FIRE = "Fire"
    OPEN_MANHOLE = "Open Manhole"
    GARBAGE = "Garbage Overflow"
    ILLEGAL_PARKING = "Illegal Parking"
    BUILDING_COLLAPSE = "Building Collapse"
    WATER_LEAK = "Water Leak"
    TREE_FALLEN = "Tree Fallen"
    FOOTPATH_ENCROACHMENT = "Footpath Encroachment"
    EARTHQUAKE = "Earthquake"
    ROAD_ACCIDENT = "Road Accident"
    LANDSLIDE = "Landslide"
    POTHOLES = "Potholes"
    WATER_LEAKAGE = "Water Leakage"
    SEWAGE = "Sewage Overflow"
    STREETLIGHT = "Broken Streetlight"
    OTHER = "Other"


class EmergencyLevel(StrEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    category: str
    severity: str
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
