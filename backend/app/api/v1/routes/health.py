from fastapi import APIRouter, status

from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK, summary="Service health")
def health_check() -> HealthResponse:
    """Return liveness information without requiring external dependencies."""
    return HealthResponse(status="healthy", service=settings.PROJECT_NAME, version=settings.VERSION)
