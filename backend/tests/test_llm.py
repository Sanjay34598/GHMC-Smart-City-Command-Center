from datetime import UTC, datetime
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.db.session import get_db
from app.modules.incidents.models import Incident
from app.modules.analyses.models import Analysis
from app.llm.models import LLMAnalysis
from app.llm.parser import LLMResponseSchema

class FakeSession:
    def __init__(self):
        self.added = []
    def add(self, model):
        self.added.append(model)
        if not getattr(model, 'id', None):
            model.id = "test-id"
        if hasattr(model, "created_at"):
            model.created_at = datetime.now(UTC)
        if hasattr(model, "updated_at"):
            model.updated_at = model.created_at
    def commit(self):
        pass
    def refresh(self, model):
        pass
    def get(self, model, ident):
        for item in self.added:
            if isinstance(item, model) and getattr(item, 'id', None) == ident:
                return item
        return None

    def query(self, model):
        mock_query = MagicMock()
        mock_filter = MagicMock()
        mock_order = MagicMock()
        
        mock_query.filter.return_value = mock_filter
        mock_filter.order_by.return_value = mock_order
        
        mock_query.filter.return_value.first.return_value = None
        mock_filter.order_by.return_value.first.return_value = None
        
        for item in self.added:
            if isinstance(item, model):
                mock_query.filter.return_value.first.return_value = item
                mock_filter.order_by.return_value.first.return_value = item
        return mock_query

shared_fake_session = FakeSession()
def fake_db():
    yield shared_fake_session

app.dependency_overrides[get_db] = fake_db
client = TestClient(app)

@pytest.fixture
def mock_gemini_client():
    with patch("app.services.llm_service.GeminiClient") as MockClient:
        mock_instance = MockClient.return_value
        
        mock_response = LLMResponseSchema(
            summary="Mock Fire Detected.",
            risk_level="Critical",
            recommended_actions=["Evacuate"],
            required_services=["Fire Department"],
            public_warning="Avoid area."
        )
        mock_instance.generate_emergency_assessment.return_value = (mock_response, 0.5, {})
        yield mock_instance

def test_summarize_incident(mock_gemini_client):
    shared_fake_session.added.clear()
    
    incident_id = "test-incident-123"
    incident = Incident(
        id=incident_id,
        title="Test Incident",
        description="A test fire incident",
        category="Fire",
        severity="High",
        latitude=40.0,
        longitude=-74.0,
        image_path="test.jpg"
    )
    shared_fake_session.add(incident)
    
    analysis = Analysis(
        incident_id=incident.id,
        model_name="test-model",
        model_version="1.0",
        status="completed",
        prediction_json={"detections": [], "severity": "High"}
    )
    shared_fake_session.add(analysis)

    # Call summarize route
    response = client.post(f"/api/v1/incidents/{incident_id}/summarize")
    assert response.status_code == 201
    data = response.json()
    assert data["summary"] == "Mock Fire Detected."
    assert data["risk_level"] == "Critical"
    assert "Evacuate" in data["recommendations"]

    # Call get summary route
    response = client.get(f"/api/v1/incidents/{incident_id}/summary")
    assert response.status_code == 200
    assert response.json()["id"] == data["id"]

