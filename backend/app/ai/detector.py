"""Module-level detector singleton and FastAPI dependency factory.

# The active detector instance is instantiated here once.
# Swapping the AI engine requires changing exactly two lines:
# 1. The import
# 2. The instance instantiation below
"""
from app.ai.base import BaseDetector
from app.ai.yolo_detector import YOLODetector
from app.ai.mock_detector import MockDetector
from app.core.config import settings

if settings.USE_MOCK_AI:
    _detector: BaseDetector = MockDetector()
else:
    _detector: BaseDetector = YOLODetector()
_detector.load_model()


def get_detector() -> BaseDetector:
    """FastAPI dependency: return the shared, pre-loaded detector instance.

    Injected into ``AIService`` via the DI chain — never called from routes
    directly.
    """
    return _detector
