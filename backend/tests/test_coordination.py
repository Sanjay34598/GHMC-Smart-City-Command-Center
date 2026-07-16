"""Tests for the multi-agent coordination endpoints.

Coverage:
- POST /incidents/{id}/coordinate → 201 with 5 agents
- GET  /incidents/{id}/coordination → 200 with existing agents
- POST → 404 for unknown incident
- GET  → 200 empty list when no coordination exists
"""
from datetime import UTC, datetime
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from app.api.v1.routes.incidents import get_llm_service
from app.db.session import get_db
from app.llm.models import AgentResponse
from app.main import app
from app.modules.incidents.models import Incident

_NOW = datetime.now(UTC)

_FAKE_INCIDENT = Incident(
    id="coord-incident-id",
    title="Coordination Test Fire",
    description="A fire for testing agent coordination.",
    category="Fire",
    severity="High",
    latitude=12.97,
    longitude=77.59,
    image_path="uploads/test.jpg",
    status="reported",
)

_FAKE_AGENTS = [
    AgentResponse(
        id=f"agent-{i}",
        incident_id="coord-incident-id",
        agent_type=name,
        status="completed",
        payload={"key": "value"},
        created_at=_NOW,
    )
    for i, name in enumerate([
        "Disaster Assessment Agent",
        "Risk Assessment Agent",
        "Emergency Coordinator Agent",
        "Public Advisory Agent",
        "Resource Planning Agent",
    ])
]


class _FakeSession:
    def get(self, model_class, pk):
        if model_class is Incident and pk == "coord-incident-id":
            return _FAKE_INCIDENT
        return None

    def query(self, model_class):
        return MagicMock(**{"filter.return_value.all.return_value": [], "filter.return_value.delete.return_value": None})

    def add(self, obj): pass
    def commit(self): pass
    def refresh(self, obj): pass
    def rollback(self): pass
    def close(self): pass


def _fake_db():
    yield _FakeSession()


client = TestClient(app)


def _mock_llm_service_returns(agents):
    svc = MagicMock()
    svc.simulate_multi_agent_coordination.return_value = agents
    svc.get_coordination_status.return_value = agents

    def _dep():
        return svc
    return _dep


def _mock_llm_service_empty():
    svc = MagicMock()
    svc.get_coordination_status.return_value = []

    def _dep():
        return svc
    return _dep


import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def _restore_overrides():
    saved = dict(app.dependency_overrides)
    yield
    app.dependency_overrides.clear()
    app.dependency_overrides.update(saved)


def test_trigger_coordination_returns_201():
    """POST /incidents/{id}/coordinate returns 201 with all 5 agent cards."""
    app.dependency_overrides[get_db] = _fake_db
    app.dependency_overrides[get_llm_service] = _mock_llm_service_returns(_FAKE_AGENTS)

    response = client.post("/api/v1/incidents/coord-incident-id/coordinate")

    assert response.status_code == 201
    body = response.json()
    assert body["incident_id"] == "coord-incident-id"
    assert len(body["agents"]) == 5
    agent_types = [a["agent_type"] for a in body["agents"]]
    assert "Disaster Assessment Agent" in agent_types
    assert "Resource Planning Agent" in agent_types


def test_trigger_coordination_404_unknown_incident():
    """POST /incidents/{id}/coordinate returns 404 for a non-existent incident."""
    app.dependency_overrides[get_db] = _fake_db
    app.dependency_overrides[get_llm_service] = _mock_llm_service_returns(_FAKE_AGENTS)

    response = client.post("/api/v1/incidents/does-not-exist/coordinate")
    assert response.status_code == 404


def test_get_coordination_returns_existing_agents():
    """GET /incidents/{id}/coordination returns 200 with existing agent records."""
    app.dependency_overrides[get_db] = _fake_db
    app.dependency_overrides[get_llm_service] = _mock_llm_service_returns(_FAKE_AGENTS)

    response = client.get("/api/v1/incidents/coord-incident-id/coordination")

    assert response.status_code == 200
    body = response.json()
    assert body["incident_id"] == "coord-incident-id"
    assert len(body["agents"]) == 5


def test_get_coordination_empty_before_trigger():
    """GET /incidents/{id}/coordination returns empty list when not yet triggered."""
    app.dependency_overrides[get_db] = _fake_db
    app.dependency_overrides[get_llm_service] = _mock_llm_service_empty()

    response = client.get("/api/v1/incidents/coord-incident-id/coordination")

    assert response.status_code == 200
    body = response.json()
    assert body["agents"] == []


def test_get_coordination_404_unknown_incident():
    """GET /incidents/{id}/coordination returns 404 for unknown incident."""
    app.dependency_overrides[get_db] = _fake_db
    app.dependency_overrides[get_llm_service] = _mock_llm_service_empty()

    response = client.get("/api/v1/incidents/unknown-id/coordination")
    assert response.status_code == 404
