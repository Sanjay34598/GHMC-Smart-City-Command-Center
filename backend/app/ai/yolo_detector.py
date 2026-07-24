import io
import time
import logging
from PIL import Image

from app.ai.base import BaseDetector
from app.ai.models import Detection, DetectorHealth, PredictionResult
from app.core.config import settings

# Initialize logger for AI Service
logger = logging.getLogger(__name__)

# Attempt to import ultralytics. If missing, we'll handle it gracefully in load_model.
try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False


class YOLODetector(BaseDetector):
    """Real YOLOv11 inference implementation.
    
    Loads an ONNX exported model for faster CPU execution during the hackathon.
    """

    # We set these manually as required by the interface
    _model_name = "YOLOv11-CityPulse"
    _model_version = "1.0.0"
    
    def __init__(self):
        self._model = None
        self._inference_backend = None
        self._device = None

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def model_version(self) -> str:
        return self._model_version

    def load_model(self) -> None:
        """Initialize weights and warm up the inference runtime."""
        if self._model is not None:
            return  # Idempotent load

        if not ULTRALYTICS_AVAILABLE:
            logger.error("ultralytics package is not installed. YOLODetector will fall back to dummy mode.")
            return

        model_path = settings.AI_MODEL_PATH
        
        try:
            logger.info(f"Attempting to load YOLO model from {model_path}...")
            # We explicitly tell it the task is 'detect'
            self._model = YOLO(model_path, task="detect")
            self._inference_backend = "ONNX Runtime"
            self._device = "cpu"  # Assuming CPU for the ONNX export in this context
            logger.info("Successfully loaded YOLO model via ONNX Runtime.")
        except Exception as e:
            logger.error(f"Failed to load YOLO model from {model_path}: {e}")
            logger.warning("YOLODetector will operate in fallback/error mode.")
            self._model = None
            self._inference_backend = "None (Error)"
            self._device = "None"

    def predict(self, image_bytes: bytes) -> PredictionResult:
        """Run inference on raw image bytes."""
        start_time = time.perf_counter()
        
        # Load image via PIL to get dimensions and pass to YOLO
        image = Image.open(io.BytesIO(image_bytes))
        width, height = image.width, image.height

        detections = []
        
        # Graceful Fallback if model failed to load
        if self._model is None:
            logger.error("Inference requested but model is not loaded! Returning System Error fallback detection.")
            detections.append(Detection(
                label="System Error (Model Missing)",
                confidence=0.0,
                bbox=[0, 0, width, height]
            ))
        else:
            try:
                # Run real YOLO inference
                logger.info(f"Running YOLO inference on {width}x{height} image...")
                results = self._model(image, verbose=False)
                result = results[0]
                
                # Extract detections from YOLO results
                for box in result.boxes:
                    cls_id = int(box.cls)
                    label = result.names[cls_id]
                    conf = float(box.conf)
                    xyxy = [float(x) for x in box.xyxy[0]]
                    
                    detections.append(Detection(
                        label=label,
                        confidence=conf,
                        bbox=xyxy
                    ))
                    
                logger.info(f"YOLO inference complete. Found {len(detections)} objects.")
                
            except Exception as e:
                logger.error(f"YOLO Inference crashed: {e}")
                detections.append(Detection(
                    label="System Error (Inference Crash)",
                    confidence=0.0,
                    bbox=[0, 0, width, height]
                ))

        inference_ms = (time.perf_counter() - start_time) * 1000

        return PredictionResult(
            detections=detections,
            model_name=self.model_name,
            model_version=self.model_version,
            inference_ms=inference_ms,
            image_width=width,
            image_height=height,
            severity=None  # Set by SeverityEngine in the service layer
        )

    def health(self) -> DetectorHealth:
        """Return current detector readiness."""
        return DetectorHealth(
            status="healthy" if self._model is not None else "degraded",
            model_loaded=self._model is not None,
            model_name=self.model_name,
            model_version=self.model_version,
            inference_backend=self._inference_backend,
            device=self._device
        )
