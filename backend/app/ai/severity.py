"""Rule-based severity classification engine.

Maps detected object labels to standardised severity levels.
Designed to be a drop-in replacement target for Gemini multimodal analysis
in Phase 4 — the ``AIService`` calls ``SeverityEngine.evaluate()`` without
caring about the underlying implementation.

Severity levels (highest → lowest priority):
    Critical > High > Medium > Low > Unknown
"""
from app.ai.models import Detection

# Label → severity lookup (case-insensitive matching applied at call site).
# Extend this table as new incident categories are added to the system.
_SEVERITY_MAP: dict[str, str] = {
    "fire": "High",
    "smoke": "Medium",
    "flood": "High",
    "collapsed building": "Critical",
    "building collapse": "Critical",
    "structural damage": "Critical",
    "tree": "Low",
    "vehicle": "Low",
    "person": "Medium",
}

# Ordered from highest to lowest priority for comparison.
_PRIORITY_ORDER: list[str] = ["Critical", "High", "Medium", "Low", "Unknown"]


class SeverityEngine:
    """Evaluates a detection list and returns the single highest severity.

    Usage::

        severity = SeverityEngine.evaluate(result.detections)

    In Phase 4 this class will be replaced by a Gemini adapter that receives
    the full image and produces a semantic severity assessment with reasoning.
    The ``AIService`` call site remains unchanged.
    """

    @staticmethod
    def evaluate(detections: list[Detection]) -> str:
        """Return the highest severity level found across all detections.

        Args:
            detections: Output of any ``BaseDetector.predict()`` call.

        Returns:
            One of ``"Critical"``, ``"High"``, ``"Medium"``, ``"Low"``,
            or ``"Unknown"`` if no label matches the rule table.
        """
        if not detections:
            return "Unknown"

        best_index = len(_PRIORITY_ORDER) - 1  # starts at "Unknown"
        best = "Unknown"

        for detection in detections:
            severity = _SEVERITY_MAP.get(detection.label.lower(), "Unknown")
            idx = (
                _PRIORITY_ORDER.index(severity)
                if severity in _PRIORITY_ORDER
                else best_index
            )
            if idx < best_index:
                best = severity
                best_index = idx

        return best
