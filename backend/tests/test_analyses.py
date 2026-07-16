"""Tests for the AI analysis pipeline (POST /analyze, GET /analysis).

Test strategy:
- Override ``get_db`` with a ``FakeSession`` that returns controlled incident
  and analysis objects without touching PostgreSQL.
- Override ``get_ai_service`` with a ``MockAIService`` to control success/failure
  outcomes without loading model weights or reading from disk.
- Each test restores overrides in a teardown fixture to prevent leakage.
"""
from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.api.v1.routes.incidents import get_ai_service, get_analysis_repo
from app.db.session import get_db
from app.main import app
from app.modules.analyses.models import Analysis, AnalysisStatus
from app.modules.incidents.models import Incident

# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

_NOW = datetime.now(UTC)

_FAKE_INCIDENT = Incident(
    id="test-incident-id",
    title="Warehouse fire",
    description="Smoke is visible from the rear loading area.",
    category="Fire",
    severity="High",
    latitude=12.9716,
    longitude=77.5946,
    image_path="uploads/test.jpg",
    status="reported",
)

_FAKE_ANALYSIS = Analysis(
    id="test-analysis-id",
    incident_id="test-incident-id",
    model_name="MockDetector",
    model_version="0.1.0",
    status=AnalysisStatus.COMPLETED,
    prediction_json={
        "detections": [{"label": "Fire", "confidence": 0.94, "bbox": [120, 80, 450, 390]}],
        "model_name": "MockDetector",
        "model_version": "0.1.0",
        "inference_ms": 52.3,
        "image_width": 640,
        "image_height": 480,
        "severity": "High",
    },
    processing_time=52.3,
    created_at=_NOW,
)


class _FakeSession:
    """Minimal DB session stub.  Callers set ``incident`` and ``analysis``
    before use to control what ``get()`` and ``query()`` return.
    """

    def __init__(self, incident=None, analysis=None):
        self._incident = incident
        self._analysis = analysis

    def get(self, model_class, pk):
        if model_class is Incident:
            return self._incident
        return None

    # SQLAlchemy chained query used by AnalysisRepository.get_latest_by_incident
    def query(self, model_class):
        outer = self

        class _Query:
            def filter(self_, *a):
                return self_

            def order_by(self_, *a):
                return self_

            def first(self_):
                return outer._analysis

        return _Query()

    def add(self, obj):
        if isinstance(obj, Analysis):
            obj.id = "test-analysis-id"
            obj.created_at = _NOW

    def commit(self):
        pass

    def refresh(self, obj):
        pass

    def rollback(self):
        pass

    def close(self):
        pass


@pytest.fixture(autouse=True)
def _restore_overrides():
    """Save and restore dependency overrides after each test.

    Using save/restore instead of ``clear()`` ensures module-level overrides
    from other test files (e.g. ``test_incidents.py``) are not wiped.
    """
    saved = dict(app.dependency_overrides)
    yield
    app.dependency_overrides.clear()
    app.dependency_overrides.update(saved)


client = TestClient(app)


# ---------------------------------------------------------------------------
# Helper builders
# ---------------------------------------------------------------------------

def _fake_db_with(incident=None, analysis=None):
    session = _FakeSession(incident=incident, analysis=analysis)

    def _dep():
        yield session

    return _dep


def _fake_repo_with(analysis=None):
    repo = MagicMock()
    repo.get_latest_by_incident.return_value = analysis

    def _dep():
        return repo

    return _dep


def _fake_service_that_returns(analysis):
    service = MagicMock()
    service.run_analysis.return_value = analysis

    def _dep():
        return service

    return _dep


def _fake_service_that_raises():
    service = MagicMock()
    service.run_analysis.side_effect = Exception("Inference failure")

    def _dep():
        return service

    return _dep


# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------

def test_analyze_invalid_incident_id():
    """POST /incidents/{id}/analyze returns 404 when the incident does not exist."""
    app.dependency_overrides[get_db] = _fake_db_with(incident=None)

    response = client.post("/api/v1/incidents/nonexistent-id/analyze")

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_analyze_missing_image():
    """POST /incidents/{id}/analyze returns 404 when the image file is missing."""
    # The service translates FileNotFoundError → HTTP 404.
    service = MagicMock()
    from fastapi import HTTPException, status as http_status

    service.run_analysis.side_effect = HTTPException(
        status_code=http_status.HTTP_404_NOT_FOUND,
        detail="The incident image is no longer available on disk.",
    )

    app.dependency_overrides[get_db] = _fake_db_with(incident=_FAKE_INCIDENT)
    app.dependency_overrides[get_ai_service] = lambda: service

    response = client.post("/api/v1/incidents/test-incident-id/analyze")

    assert response.status_code == 404
    assert "image" in response.json()["detail"].lower()


def test_analyze_prediction_success():
    """POST /incidents/{id}/analyze returns 201 with completed detections."""
    app.dependency_overrides[get_db] = _fake_db_with(incident=_FAKE_INCIDENT)
    app.dependency_overrides[get_ai_service] = _fake_service_that_returns(_FAKE_ANALYSIS)

    response = client.post("/api/v1/incidents/test-incident-id/analyze")

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == AnalysisStatus.COMPLETED
    assert body["prediction_json"] is not None
    detections = body["prediction_json"]["detections"]
    assert len(detections) == 1
    assert detections[0]["label"] == "Fire"
    assert detections[0]["confidence"] == 0.94


def test_analyze_prediction_failure():
    """POST /incidents/{id}/analyze returns 503 when the inference pipeline fails."""
    from fastapi import HTTPException, status as http_status

    service = MagicMock()
    service.run_analysis.side_effect = HTTPException(
        status_code=http_status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="The AI inference pipeline is temporarily unavailable.",
    )

    app.dependency_overrides[get_db] = _fake_db_with(incident=_FAKE_INCIDENT)
    app.dependency_overrides[get_ai_service] = lambda: service

    response = client.post("/api/v1/incidents/test-incident-id/analyze")

    assert response.status_code == 503


def test_get_analysis_returns_existing():
    """GET /incidents/{id}/analysis returns the latest stored analysis."""
    app.dependency_overrides[get_db] = _fake_db_with(incident=_FAKE_INCIDENT)
    app.dependency_overrides[get_analysis_repo] = _fake_repo_with(analysis=_FAKE_ANALYSIS)

    response = client.get("/api/v1/incidents/test-incident-id/analysis")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "test-analysis-id"
    assert body["status"] == AnalysisStatus.COMPLETED


def test_get_analysis_returns_404_when_none():
    """GET /incidents/{id}/analysis returns 404 if no analysis exists yet."""
    app.dependency_overrides[get_db] = _fake_db_with(incident=_FAKE_INCIDENT)
    app.dependency_overrides[get_analysis_repo] = _fake_repo_with(analysis=None)

    response = client.get("/api/v1/incidents/test-incident-id/analysis")

    assert response.status_code == 404
