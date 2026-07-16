from datetime import UTC, datetime
from pathlib import Path

from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app
from app.modules.incidents.storage import UPLOADS_DIRECTORY


class FakeSession:
    def add(self, incident):
        incident.id = "test-incident-id"
        incident.created_at = datetime.now(UTC)
        incident.updated_at = incident.created_at

    def commit(self):
        return None

    def refresh(self, incident):
        return None

    def rollback(self):
        return None


def fake_db():
    yield FakeSession()


app.dependency_overrides[get_db] = fake_db
client = TestClient(app)

VALID_DATA = {"title": "Warehouse fire", "description": "Smoke is visible from the rear loading area.", "category": "Fire", "severity": "High", "latitude": "12.9716", "longitude": "77.5946"}


def post_incident(data=None, image=("evidence.png", b"image-bytes", "image/png")):
    return client.post("/api/v1/incidents", data=data or VALID_DATA, files={"image": image})


def test_successful_upload():
    response = post_incident()
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == VALID_DATA["title"]
    saved_file = Path(__file__).resolve().parents[1] / body["image_path"]
    assert saved_file.exists()
    saved_file.unlink()


def test_rejects_wrong_file_type():
    response = post_incident(image=("notes.txt", b"not-an-image", "text/plain"))
    assert response.status_code == 415


def test_rejects_large_image():
    response = post_incident(image=("large.png", b"a" * (10 * 1024 * 1024 + 1), "image/png"))
    assert response.status_code == 413


def test_rejects_missing_required_fields():
    response = post_incident(data={"title": "Too short"})
    assert response.status_code == 422
