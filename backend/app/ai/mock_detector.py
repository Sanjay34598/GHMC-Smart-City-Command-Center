"""Deterministic mock detector for development and testing.

Returns realistic, hard-coded predictions without requiring model weights,
GPU, or any heavy dependencies.  Replace this with ``YOLODetector`` in Phase 3
by updating the singleton in ``detector.py`` — the service layer is unaffected.
"""
import time

from app.ai.base import BaseDetector
from app.ai.models import Detection, DetectorHealth, PredictionResult
from app.core.config import settings


class MockDetector(BaseDetector):
    """Stub detector that satisfies the ``BaseDetector`` contract.

    Behaviour:
    - ``load_model()`` is a no-op that flips a readiness flag.
    - ``predict()`` sleeps 50 ms to simulate realistic latency and returns
      two fixed detections (Fire + Smoke) with plausible bounding boxes.
    - ``health()`` reflects the current loaded state.

    All strings (model_name, model_version) are driven by ``Settings`` so they
    can be overridden via environment variables without touching this class.
    """

    _loaded: bool = False

    @property
    def model_name(self) -> str:
        return settings.AI_MODEL_NAME

    @property
    def model_version(self) -> str:
        return settings.AI_MODEL_VERSION

    def load_model(self) -> None:
        """Mark the mock as ready; no weights to load."""
        self._loaded = True

    def predict(self, image_bytes: bytes) -> PredictionResult:
        """Return deterministic mock detections after a simulated latency pause."""
        if not self._loaded:
            raise RuntimeError(
                "MockDetector has not been initialised. Call load_model() before predict()."
            )
        # Simulate ~50 ms inference so the frontend "Analyzing..." state is visible.
        time.sleep(0.05)
        return PredictionResult(
            detections=[
                Detection(label="Fire", confidence=0.94, bbox=[120, 80, 450, 390]),
                Detection(label="Smoke", confidence=0.87, bbox=[200, 40, 500, 200]),
            ],
            model_name=self.model_name,
            model_version=self.model_version,
            inference_ms=52.3,
            # Fixed dimensions matching common YOLO input size; real detectors
            # will derive these from the decoded image tensor.
            image_width=640,
            image_height=480,
        )

    def health(self) -> DetectorHealth:
        return DetectorHealth(
            status="healthy" if self._loaded else "uninitialized",
            model_loaded=self._loaded,
            model_name=self.model_name,
            model_version=self.model_version,
        )
