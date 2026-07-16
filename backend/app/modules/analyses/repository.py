"""Data-access layer for Analysis records.

Only this repository touches the ``analyses`` table.
``AIService`` calls these methods; API routes call ``AIService``.
No SQL ever appears in routes or services.
"""
from sqlalchemy.orm import Session

from app.ai.models import PredictionResult
from app.ai.utils import prediction_to_dict
from app.modules.analyses.models import Analysis, AnalysisStatus


class AnalysisRepository:
    """CRUD operations for the ``analyses`` table.

    Injected into ``AIService`` as a constructor dependency, which makes the
    service testable without a real database (pass a mock repo in tests).
    """

    def __init__(self, db: Session) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    def create_pending(
        self,
        incident_id: str,
        model_name: str,
        model_version: str,
    ) -> Analysis:
        """Persist a new analysis row in PENDING state and return it."""
        analysis = Analysis(
            incident_id=incident_id,
            model_name=model_name,
            model_version=model_version,
            status=AnalysisStatus.PENDING,
        )
        self._db.add(analysis)
        self._db.commit()
        self._db.refresh(analysis)
        return analysis

    def mark_processing(self, analysis: Analysis) -> Analysis:
        """Transition an analysis to the PROCESSING state."""
        analysis.status = AnalysisStatus.PROCESSING
        self._db.commit()
        self._db.refresh(analysis)
        return analysis

    def mark_completed(
        self,
        analysis: Analysis,
        result: PredictionResult,
        processing_ms: float,
    ) -> Analysis:
        """Store prediction output and mark the analysis as COMPLETED."""
        analysis.status = AnalysisStatus.COMPLETED
        analysis.prediction_json = prediction_to_dict(result)
        analysis.processing_time = processing_ms
        self._db.commit()
        self._db.refresh(analysis)
        return analysis

    def mark_failed(self, analysis: Analysis) -> Analysis:
        """Mark an analysis as FAILED after an unrecoverable error."""
        analysis.status = AnalysisStatus.FAILED
        self._db.commit()
        self._db.refresh(analysis)
        return analysis

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    def get_latest_by_incident(self, incident_id: str) -> Analysis | None:
        """Return the most recently created analysis for an incident, or None."""
        return (
            self._db.query(Analysis)
            .filter(Analysis.incident_id == incident_id)
            .order_by(Analysis.created_at.desc())
            .first()
        )
