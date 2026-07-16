"""ORM model for AI analysis results.

Design decisions:
- ``prediction_json`` uses PostgreSQL ``JSONB`` (not TEXT) to enable GIN-indexed
  queries, ``@>`` containment operators, and future dashboard aggregations.
- ``status`` tracks the full lifecycle (PENDING → PROCESSING → COMPLETED/FAILED)
  so the frontend can display accurate states and future async workers can
  resume interrupted jobs.
- ``model_version`` is stored alongside ``model_name`` so analysts can compare
  results produced by different weight checkpoints over the same incident.
- One ``Incident`` may have many ``Analysis`` rows (e.g. re-analysis after a
  model upgrade), ordered by ``created_at``.
"""
from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.types import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AnalysisStatus:
    """String constants for the analysis lifecycle.

    Using a plain class (rather than StrEnum) avoids a SQLAlchemy mapped_column
    type annotation conflict on older Python versions.
    """

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Analysis(Base):
    """Persisted AI analysis result linked to an uploaded incident image."""

    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    incident_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("incidents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    model_name: Mapped[str] = mapped_column(String(64), nullable=False)
    model_version: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        default=AnalysisStatus.PENDING,
        index=True,
    )
    # JSON enables indexing and PostgreSQL JSON operators for dashboards.
    # ``nullable=True`` because predictions are absent until COMPLETED.
    prediction_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Stored in milliseconds; None until the analysis reaches COMPLETED/FAILED.
    processing_time: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
