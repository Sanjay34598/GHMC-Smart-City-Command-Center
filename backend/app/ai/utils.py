"""Serialisation helpers for AI prediction output."""
from app.ai.models import PredictionResult


def prediction_to_dict(result: PredictionResult) -> dict:
    """Serialise a ``PredictionResult`` to a plain dict for JSONB storage.

    Using ``model_dump()`` ensures all nested Pydantic models (e.g. individual
    ``Detection`` objects) are fully serialised rather than stored as object
    references.
    """
    return result.model_dump()
