"""AI model health check endpoint."""
from fastapi import APIRouter, Depends

from app.ai.base import BaseDetector
from app.ai.detector import get_detector
from app.ai.models import DetectorHealth

router = APIRouter(prefix="/ai")


@router.get(
    "/health",
    response_model=DetectorHealth,
    summary="AI detector health",
    tags=["ai"],
)
def ai_health(detector: BaseDetector = Depends(get_detector)) -> DetectorHealth:
    """Return the readiness state of the active detector.

    Useful for deployment probes and hackathon demo verification.
    A ``model_loaded: true`` response confirms the detector is ready to accept
    inference requests.
    """
    return detector.health()
