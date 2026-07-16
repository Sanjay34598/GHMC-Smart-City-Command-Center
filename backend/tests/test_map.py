import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_get_map_incidents_empty():
    response = client.get("/api/v1/map/incidents")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data

def test_get_emergency_services_mocked(monkeypatch):
    # Mock the internal cache lookup to avoid real Overpass API calls during testing
    import app.api.v1.routes.map as map_routes
    
    def mock_get_cached_services(lat, lon, radius):
        return [
            {
                "id": "123",
                "name": "General Hospital",
                "category": "hospital",
                "latitude": 40.7128,
                "longitude": -74.0060,
                "distance_km": 1.2,
                "address": "123 Main St",
                "phone": "555-1234"
            }
        ]
        
    monkeypatch.setattr(map_routes, "_get_cached_services", mock_get_cached_services)
    
    response = client.get("/api/v1/map/emergency-services?lat=40.7128&lon=-74.0060&radius=5000")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "General Hospital"
    assert data["items"][0]["category"] == "hospital"

def test_get_emergency_services_filtered(monkeypatch):
    import app.api.v1.routes.map as map_routes
    
    def mock_get_cached_services(lat, lon, radius):
        return [
            {
                "id": "1",
                "name": "General Hospital",
                "category": "hospital",
                "latitude": 40.7128,
                "longitude": -74.0060,
                "distance_km": 1.2,
                "address": None,
                "phone": None
            },
            {
                "id": "2",
                "name": "City Fire Station",
                "category": "fire_station",
                "latitude": 40.7130,
                "longitude": -74.0065,
                "distance_km": 1.5,
                "address": None,
                "phone": None
            }
        ]
        
    monkeypatch.setattr(map_routes, "_get_cached_services", mock_get_cached_services)
    
    response = client.get("/api/v1/map/emergency-services?lat=40.7128&lon=-74.0060&radius=5000&category=fire_station")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["category"] == "fire_station"
