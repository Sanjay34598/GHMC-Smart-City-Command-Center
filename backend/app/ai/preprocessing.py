"""Image I/O utilities for the AI pipeline.

Responsible solely for reading image bytes from disk.  All path resolution
is done here so the service layer never manipulates file paths directly.
"""
from pathlib import Path

# Three parents up from app/ai/ → backend/
_BACKEND_ROOT = Path(__file__).resolve().parents[3]


def load_image_bytes(image_path: str) -> bytes:
    """Read an uploaded image from its application-relative path.

    Args:
        image_path: Relative path as stored in ``Incident.image_path``
                    (e.g. ``"uploads/abc123.jpg"``).

    Returns:
        Raw image bytes suitable for passing directly to a detector.

    Raises:
        FileNotFoundError: If the image has been deleted or the path is wrong.
    """
    full_path = _BACKEND_ROOT / image_path
    if not full_path.exists():
        raise FileNotFoundError(
            f"Incident image not found on disk: {full_path}"
        )
    return full_path.read_bytes()
