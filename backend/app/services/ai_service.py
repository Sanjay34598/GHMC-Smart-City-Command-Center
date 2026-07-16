"""AI analysis orchestration service.

This is the only file that coordinates the full pipeline:

    Route → AIService.run_analysis() → preprocessing → detector → severity → repository

Design principles:
- Routes never contain business logic; they only call this service.
- ``AIService`` depends on ``BaseDetector`` (not a concrete class), making
  detector swaps transparent.
- The repository handles all DB mutations; the service stays storage-agnostic.
- Exceptions are translated into HTTP responses here, not in routes.
"""
import time
import logging

from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

from app.ai.base import BaseDetector
from app.ai.preprocessing import load_image_bytes
from app.ai.severity import SeverityEngine
from app.modules.analyses.models import Analysis
from app.modules.analyses.repository import AnalysisRepository
from app.modules.incidents.models import Incident


class AIService:
    """Orchestrates the full AI analysis pipeline for a single incident.

    Constructor dependencies are injected by FastAPI's DI system via
    ``get_ai_service()`` in the route module — never instantiated directly.

    Args:
        detector: Any ``BaseDetector`` implementation (Mock, YOLO, Gemini…).
        repo: Repository for persisting and retrieving ``Analysis`` records.
    """

    def __init__(self, detector: BaseDetector, repo: AnalysisRepository) -> None:
        self._detector = detector
        self._repo = repo

    def run_analysis(self, incident: Incident) -> Analysis:
        """Execute the full pipeline and return a persisted ``Analysis`` record.

        Pipeline steps:
        1. Create an ``Analysis`` row in PENDING state.
        2. Transition to PROCESSING.
        3. Load image bytes from disk.
        4. Run detector inference.
        5. Compute severity via SeverityEngine.
        6. Persist results and transition to COMPLETED.
        7. On any failure, transition to FAILED and re-raise as HTTP exception.

        Args:
            incident: The source incident whose ``image_path`` will be analysed.

        Returns:
            The persisted, COMPLETED ``Analysis`` ORM object.

        Raises:
            HTTPException 404: If the incident image cannot be found on disk.
            HTTPException 503: If the detector or any other pipeline step fails.
        """
        analysis = self._repo.create_pending(
            incident_id=incident.id,
            model_name=self._detector.model_name,
            model_version=self._detector.model_version,
        )
        self._repo.mark_processing(analysis)

        try:
            logger.info(f"Loading image bytes for incident {incident.id}")
            image_bytes = load_image_bytes(incident.image_path)

            wall_start = time.perf_counter()
            logger.info(f"Starting detector inference via {self._detector.model_name}")
            result = self._detector.predict(image_bytes)
            elapsed_ms = (time.perf_counter() - wall_start) * 1000
            
            logger.info(f"Inference complete in {elapsed_ms:.2f}ms. Found {len(result.detections)} objects.")

            # SeverityEngine will be replaced by a Gemini adapter in Phase 4.
            severity = SeverityEngine.evaluate(result.detections)
            result = result.model_copy(update={"severity": severity})

            return self._repo.mark_completed(analysis, result, elapsed_ms)

        except FileNotFoundError as exc:
            logger.error(f"Image file missing for incident {incident.id}")
            self._repo.mark_failed(analysis)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The incident image is no longer available on disk.",
            ) from exc

        except Exception as exc:
            logger.exception(f"AI inference pipeline failed for incident {incident.id}: {exc}")
            self._repo.mark_failed(analysis)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="The AI inference pipeline is temporarily unavailable.",
            ) from exc
