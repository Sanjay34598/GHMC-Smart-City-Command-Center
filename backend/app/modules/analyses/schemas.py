"""Pydantic response schema for analysis records."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AnalysisResponse(BaseModel):
    """Serialised view of an ``Analysis`` ORM record returned to API consumers.

    ``prediction_json`` is passed through as-is; the frontend is responsible
    for type-narrowing its contents (detections, image dimensions, severity).
    """

    model_config = ConfigDict(from_attributes=True)

    id: str
    incident_id: str
    model_name: str
    model_version: str
    status: str
    prediction_json: dict | None
    processing_time: float | None
    created_at: datetime
