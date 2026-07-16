"""Abstract base class that every detector must implement.

This interface is the sole contract between ``AIService`` and any detector
implementation (Mock, YOLO, Gemini, etc.).  The service layer imports only
``BaseDetector`` — never a concrete class — so the active detector can be
swapped purely by changing the singleton in ``detector.py``.
"""
from abc import ABC, abstractmethod

from app.ai.models import DetectorHealth, PredictionResult


class BaseDetector(ABC):
    """Pluggable inference engine interface.

    Phase 3 (YOLOv11) and Phase 4 (Gemini) implement this contract.
    Changing the detector requires zero changes to the service layer or
    any API route.
    """

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Human-readable identifier for this model family."""

    @property
    @abstractmethod
    def model_version(self) -> str:
        """Semantic version string for the active weights or mock revision."""

    @abstractmethod
    def load_model(self) -> None:
        """Initialize weights and warm up the inference runtime.

        Called once at application startup via the singleton in ``detector.py``.
        Must be idempotent.
        """

    @abstractmethod
    def predict(self, image_bytes: bytes) -> PredictionResult:
        """Run inference on raw image bytes and return structured detections.

        Args:
            image_bytes: Raw bytes of any supported image format (JPEG/PNG/WEBP).

        Returns:
            ``PredictionResult`` with detections, image dimensions, and timing.

        Raises:
            RuntimeError: If the model has not been loaded via ``load_model()``.
        """

    @abstractmethod
    def health(self) -> DetectorHealth:
        """Return current detector readiness for health-check endpoints."""
