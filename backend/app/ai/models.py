"""Pydantic data models shared across all detector implementations."""
from pydantic import BaseModel, Field


class Detection(BaseModel):
    """A single detected object returned by any detector implementation."""

    label: str
    confidence: float = Field(ge=0.0, le=1.0, description="Detection confidence in [0, 1]")
    bbox: list[int] = Field(
        min_length=4,
        max_length=4,
        description="Bounding box as [x1, y1, x2, y2] in original image pixel coordinates.",
    )


class PredictionResult(BaseModel):
    """Full inference output from a single detector pass.

    ``image_width`` and ``image_height`` record the original image dimensions so
    the frontend can scale bounding boxes to any display size without server help.
    ``severity`` is populated by ``SeverityEngine`` in the service layer — detectors
    do not set it directly.
    """

    detections: list[Detection]
    model_name: str
    model_version: str
    inference_ms: float = Field(description="Wall-clock inference duration in milliseconds")
    image_width: int = Field(description="Original image width in pixels")
    image_height: int = Field(description="Original image height in pixels")
    severity: str | None = Field(
        default=None,
        description="Highest severity derived from detections by SeverityEngine",
    )


class DetectorHealth(BaseModel):
    """Readiness report for a detector instance."""

    status: str
    model_loaded: bool
    model_name: str
    model_version: str
    inference_backend: str | None = None
    device: str | None = None
