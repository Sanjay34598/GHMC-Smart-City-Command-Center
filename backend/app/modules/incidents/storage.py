from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

ALLOWED_CONTENT_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024
UPLOADS_DIRECTORY = Path(__file__).resolve().parents[3] / "uploads"


async def save_incident_image(upload: UploadFile) -> str:
    """Validate and persist an image upload, returning its application-relative path."""
    if upload.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Image must be a JPG, PNG, or WEBP file.")

    UPLOADS_DIRECTORY.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4()}{ALLOWED_CONTENT_TYPES[upload.content_type]}"
    destination = UPLOADS_DIRECTORY / filename
    bytes_written = 0

    try:
        with destination.open("wb") as file:
            while chunk := await upload.read(1024 * 1024):
                bytes_written += len(chunk)
                if bytes_written > MAX_IMAGE_SIZE_BYTES:
                    raise HTTPException(status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Image must not exceed 10 MB.")
                file.write(chunk)
    except HTTPException:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await upload.close()

    return f"uploads/{filename}"


def remove_incident_image(image_path: str) -> None:
    """Remove an upload when the associated database transaction cannot complete."""
    (UPLOADS_DIRECTORY.parent / image_path).unlink(missing_ok=True)
