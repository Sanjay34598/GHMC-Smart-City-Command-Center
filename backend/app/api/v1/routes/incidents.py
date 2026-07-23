"""Incident API routes — report, retrieve, and analyse incidents.

Architecture:
    Route functions handle HTTP concerns only (status codes, 404 raises,
    response serialisation).  All business logic lives in ``AIService``.
    All data access lives in ``AnalysisRepository``.
    Route functions are kept intentionally thin.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.ai.base import BaseDetector
from app.ai.detector import get_detector
from app.db.session import get_db
from app.llm.schemas import AgentStatusUpdate, CoordinationResponse, LLMAnalysisResponse
from app.modules.analyses.repository import AnalysisRepository
from app.modules.analyses.schemas import AnalysisResponse
from app.modules.incidents.models import Incident
from app.modules.incidents.schemas import (
    EmergencyLevel,
    IncidentCategory,
    IncidentResponse,
    IncidentUpdateStatus,
)
from app.modules.incidents.storage import remove_incident_image, save_incident_image
from app.services.ai_service import AIService
from app.services.llm_service import LLMService
from app.services.notification_service import NotificationService


router = APIRouter(prefix="/incidents")


# ---------------------------------------------------------------------------
# Shared dependency helpers
# ---------------------------------------------------------------------------


def get_incident_or_404(id: str, db: Session = Depends(get_db)) -> Incident:
    """Fetch an incident by primary key or raise 404.

    Centralised here so both the GET and POST routes stay DRY.
    """
    incident = db.get(Incident, id)
    if incident is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found.",
        )
    return incident


def get_analysis_repo(db: Session = Depends(get_db)) -> AnalysisRepository:
    """Instantiate the repository with the request-scoped DB session."""
    return AnalysisRepository(db)


def get_ai_service(
    detector: BaseDetector = Depends(get_detector),
    repo: AnalysisRepository = Depends(get_analysis_repo),
) -> AIService:
    """Compose the AIService from its injected dependencies."""
    return AIService(detector, repo)


def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    return NotificationService(db)


def get_llm_service(db: Session = Depends(get_db)) -> LLMService:
    return LLMService(db)


# ---------------------------------------------------------------------------
# Incident routes
# ---------------------------------------------------------------------------


@router.post(
    "",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Report an incident",
)
async def create_incident(
    title: Annotated[str, Form(min_length=3, max_length=160)],
    description: Annotated[str, Form(min_length=10, max_length=5000)],
    category: Annotated[IncidentCategory, Form()],
    severity: Annotated[EmergencyLevel, Form()],
    latitude: Annotated[float, Form(ge=-90, le=90)],
    longitude: Annotated[float, Form(ge=-180, le=180)],
    image: Annotated[UploadFile, File(description="JPG, PNG, or WEBP image up to 10 MB")],
    db: Session = Depends(get_db),
    notifier: NotificationService = Depends(get_notification_service),
) -> Incident:
    """Store an image-backed incident report after multipart validation."""
    image_path = await save_incident_image(image)
    incident = Incident(
        title=title.strip(),
        description=description.strip(),
        category=category.value,
        severity=severity.value,
        latitude=latitude,
        longitude=longitude,
        image_path=image_path,
        status="reported",
    )
    try:
        db.add(incident)
        db.commit()
        db.refresh(incident)
    except Exception as error:
        db.rollback()
        remove_incident_image(image_path)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Incident storage is temporarily unavailable.",
        ) from error

    notifier.trigger_event(
        incident=incident,
        event_type="INCIDENT_CREATED",
        title="New Incident Reported",
        message=f"{incident.title} ({incident.severity}) has been reported.",
    )
    return incident


@router.post(
    "/report",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Report a citizen incident",
)
async def report_incident(
    title: Annotated[str, Form(min_length=1, max_length=160)],
    description: Annotated[str, Form(min_length=1, max_length=5000)],
    category: Annotated[str, Form()],
    latitude: Annotated[float, Form(ge=-90, le=90)],
    longitude: Annotated[float, Form(ge=-180, le=180)],
    image: Annotated[UploadFile, File(description="JPG, PNG, or WEBP image up to 10 MB")] = None, # type: ignore
    db: Session = Depends(get_db),
    notifier: NotificationService = Depends(get_notification_service),
) -> Incident:
    """Store citizen reported incident with default Pending Verification status and Medium severity."""
    image_path = "uploads/demo_placeholder.jpg"
    if image and image.filename:
        image_path = await save_incident_image(image)

    incident = Incident(
        title=title.strip(),
        description=description.strip(),
        category=category.strip(),
        severity="Medium",
        latitude=latitude,
        longitude=longitude,
        image_path=image_path,
        status="Pending Verification",
        is_civic_issue=True,
    )
    try:
        db.add(incident)
        db.commit()
        db.refresh(incident)
    except Exception as error:
        db.rollback()
        if image_path != "uploads/demo_placeholder.jpg":
            remove_incident_image(image_path)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Incident storage is temporarily unavailable.",
        ) from error

    notifier.trigger_event(
        incident=incident,
        event_type="INCIDENT_CREATED",
        title="New citizen incident received.",
        message=f"{incident.title} ({incident.category}) reported.",
    )
    return incident


@router.get(
    "/{id}",
    response_model=IncidentResponse,
    summary="Get incident by ID",
)
def get_incident(
    incident: Incident = Depends(get_incident_or_404),
) -> Incident:
    """Return a single incident record by its UUID."""
    return incident


@router.patch(
    "/{id}/status",
    response_model=IncidentResponse,
    summary="Update incident status",
)
def update_incident_status(
    payload: IncidentUpdateStatus,
    incident: Incident = Depends(get_incident_or_404),
    db: Session = Depends(get_db),
    notifier: NotificationService = Depends(get_notification_service),
) -> Incident:
    """Update the status of an incident (e.g. dispatched, resolved)."""
    incident.status = payload.status
    db.commit()
    db.refresh(incident)

    notifier.trigger_event(
        incident=incident,
        event_type="INCIDENT_UPDATED",
        title="Incident Status Updated",
        message=f"{incident.title} status changed to {payload.status}.",
    )
    return incident


# ---------------------------------------------------------------------------
# Analysis routes
# ---------------------------------------------------------------------------


@router.post(
    "/{id}/analyze",
    response_model=AnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Run AI analysis on an incident image",
)
def analyze_incident(
    incident: Incident = Depends(get_incident_or_404),
    service: AIService = Depends(get_ai_service),
    notifier: NotificationService = Depends(get_notification_service),
) -> AnalysisResponse:
    """Trigger the AI detection pipeline for the given incident.

    The route delegates entirely to ``AIService.run_analysis()``.
    No business logic lives here.
    """
    analysis = service.run_analysis(incident)

    notifier.trigger_event(
        incident=incident,
        event_type="INCIDENT_ANALYZED",
        title="AI Analysis Complete",
        message=f"YOLO detection finished for {incident.title}.",
    )
    return analysis


@router.get(
    "/{id}/analysis",
    response_model=AnalysisResponse,
    summary="Get latest analysis for an incident",
)
def get_analysis(
    incident: Incident = Depends(get_incident_or_404),
    repo: AnalysisRepository = Depends(get_analysis_repo),
) -> AnalysisResponse:
    """Return the most recent analysis record without re-running inference.

    The frontend calls this on page load; if a 404 is returned, it then
    calls ``POST /{id}/analyze`` to initiate the first analysis.
    This prevents re-running expensive inference on every page refresh.
    """
    analysis = repo.get_latest_by_incident(incident.id)
    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analysis found for this incident.",
        )
    return analysis


# ---------------------------------------------------------------------------
# LLM Intelligence routes
# ---------------------------------------------------------------------------


@router.post(
    "/{id}/summarize",
    response_model=LLMAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Gemini AI summary for an incident",
)
def summarize_incident(
    incident: Incident = Depends(get_incident_or_404),
    service: LLMService = Depends(get_llm_service),
    notifier: NotificationService = Depends(get_notification_service),
) -> LLMAnalysisResponse:
    """Generate an intelligent emergency assessment using Gemini."""
    summary = service.generate_summary(incident)

    notifier.trigger_event(
        incident=incident,
        event_type="INCIDENT_UPDATED",
        title="AI Summary Generated",
        message=f"Gemini has generated an emergency assessment for {incident.title}.",
    )
    return summary


@router.get(
    "/{id}/summary",
    response_model=LLMAnalysisResponse,
    summary="Get latest AI summary for an incident",
)
def get_incident_summary(
    incident: Incident = Depends(get_incident_or_404),
    service: LLMService = Depends(get_llm_service),
) -> LLMAnalysisResponse:
    """Return the most recent AI summary record."""
    return service.get_summary(incident.id)


@router.post(
    "/{id}/coordinate",
    response_model=CoordinationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger multi-agent coordination",
)
def trigger_coordination(
    incident: Incident = Depends(get_incident_or_404),
    service: LLMService = Depends(get_llm_service),
) -> CoordinationResponse:
    """Run the 5-agent EOC simulation and store results."""
    agents = service.simulate_multi_agent_coordination(incident)
    return CoordinationResponse(
        incident_id=incident.id,
        agents=[AgentStatusUpdate.model_validate(a) for a in agents],
    )


@router.get(
    "/{id}/coordination",
    response_model=CoordinationResponse,
    summary="Get multi-agent coordination status",
)
def get_coordination(
    incident: Incident = Depends(get_incident_or_404),
    service: LLMService = Depends(get_llm_service),
) -> CoordinationResponse:
    """Return all stored agent responses for an incident."""
    agents = service.get_coordination_status(incident.id)
    return CoordinationResponse(
        incident_id=incident.id,
        agents=[AgentStatusUpdate.model_validate(a) for a in agents],
    )
