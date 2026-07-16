"""Professional EOC seed script — populates the database with verified Hyderabad-specific mock data.

Usage:
    cd backend
    python -m app.scripts.seed_hyderabad

Requires:
    - A running PostgreSQL or SQLite database
"""
import sys
import logging
import random
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger("seed_hyderabad")

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from app.db.session import SessionLocal
from app.db.base import Base
from app.db.session import engine
from app.modules.incidents.models import Incident
from app.modules.analyses.models import Analysis, AnalysisStatus
from app.llm.models import LLMAnalysis, AgentResponse


# Verified exact coordinates for Hyderabad Wards
WARD_COORDS = {
    "Gachibowli": (17.4401, 78.3489),
    "Hitech City": (17.4435, 78.3772),
    "Kukatpally": (17.4849, 78.4026),
    "Madhapur": (17.4483, 78.3915),
    "Jubilee Hills": (17.4326, 78.4071),
    "Banjara Hills": (17.4156, 78.4347),
    "Ameerpet": (17.4357, 78.4444),
    "Secunderabad": (17.4399, 78.4983),
    "Charminar": (17.3616, 78.4747),
    "LB Nagar": (17.3457, 78.5522),
    "Nagole": (17.3730, 78.5600),
    "Uppal": (17.3984, 78.5583),
    "Miyapur": (17.4933, 78.3414),
    "Kompally": (17.5348, 78.4842),
    "Dilsukhnagar": (17.3688, 78.5247),
    "Mehdipatnam": (17.3916, 78.4399)
}

CIVIC_CATEGORIES = [
    "Wrong Way Driving", "Illegal Parking", "Signal Jumping", "Littering", 
    "Garbage Overflow", "Illegal Dumping", "Potholes", "Broken Streetlights", 
    "Water Leakage", "Sewage Overflow", "Open Manholes", "Tree Fall", 
    "Road Damage", "Footpath Encroachment", "Construction Debris"
]

DISASTER_CATEGORIES = ["Fire", "Flood", "Accident", "Road Block", "Building Collapse"]
SEVERITIES = ["Critical", "High", "Medium", "Low"]

# Extended lifecycle statuses
STATUSES = [
    "Citizen Report", "AI Analysis", "Department Assignment", "Officer Assigned", 
    "Work Started", "Progress Updates", "Resolved", "Citizen Notified"
]

# Real GHMC / Hyderabad Departments
DEPARTMENTS = [
    "GHMC Sanitation", "GHMC Roads & Buildings", "GHMC Engineering", 
    "HMWSSB", "Hyderabad Traffic Police", "Telangana Fire Services", "TSSPDCL"
]

def get_exact_lat_lon(ward: str):
    # Base coordinate + extremely minor jitter (0.005 = ~500 meters) to avoid overlapping markers
    base_lat, base_lon = WARD_COORDS[ward]
    jitter_lat = random.uniform(-0.005, 0.005)
    jitter_lon = random.uniform(-0.005, 0.005)
    return base_lat + jitter_lat, base_lon + jitter_lon

def create_civic_issue():
    ward = random.choice(list(WARD_COORDS.keys()))
    lat, lon = get_exact_lat_lon(ward)
    category = random.choice(CIVIC_CATEGORIES)
    severity = random.choices(SEVERITIES, weights=[5, 20, 50, 25])[0]
    status = random.choice(STATUSES)
    dept = random.choice(DEPARTMENTS)
    
    incident_id = str(uuid4())
    created_at = datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 168))
    
    incident = Incident(
        id=incident_id,
        title=f"{category} in {ward}",
        description=f"Citizen report: {category} visually confirmed at {ward}. Assignment: {dept}.",
        category=category,
        severity=severity,
        latitude=lat,
        longitude=lon,
        image_path="/uploads/demo_placeholder.jpg",
        status=status,
        is_civic_issue=True,
        ward=ward,
        department=dept,
        estimated_resolution=f"{(datetime.now(timezone.utc) + timedelta(days=random.randint(1, 5))).strftime('%Y-%m-%d')}",
        created_at=created_at,
        updated_at=created_at + timedelta(hours=random.randint(0, 5))
    )
    
    analysis_id = str(uuid4())
    analysis = Analysis(
        id=analysis_id,
        incident_id=incident_id,
        model_name="YOLOv11-Disaster",
        model_version="1.0.0",
        status=AnalysisStatus.COMPLETED,
        prediction_json={
            "detections": [{"label": category.lower(), "confidence": round(random.uniform(0.7, 0.99), 2), "bbox": [10, 10, 100, 100]}],
            "severity": severity,
            "inference_ms": 312.7,
            "image_width": 640,
            "image_height": 480,
        },
        processing_time=312.7,
        created_at=created_at + timedelta(minutes=random.randint(1, 10))
    )
    
    llm = LLMAnalysis(
        id=str(uuid4()),
        incident_id=incident_id,
        provider="gemini",
        model="gemini-1.5-flash",
        prompt_version="v1",
        summary=f"AI verified {category} at {ward}. Forwarding workflow to {dept}.",
        risk_level=severity,
        recommendations=[f"Dispatch {dept} team", "Assign local ward officer"],
        services=[dept],
        warning="Operational issue logged.",
        response_time=1.23,
        token_usage={"prompt_token_count": 480, "candidates_token_count": 210, "total_token_count": 690},
        created_at=created_at + timedelta(minutes=random.randint(1, 10))
    )
    
    return incident, analysis, llm, []

def create_disaster_issue():
    ward = random.choice(list(WARD_COORDS.keys()))
    lat, lon = get_exact_lat_lon(ward)
    category = random.choice(DISASTER_CATEGORIES)
    severity = random.choices(["Critical", "High"], weights=[60, 40])[0]
    
    # Active disasters are usually not "Resolved" in a live board
    status = random.choice(["Department Assignment", "Officer Assigned", "Work Started", "Progress Updates"])
    
    incident_id = str(uuid4())
    created_at = datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 72))
    
    incident = Incident(
        id=incident_id,
        title=f"Emergency: {category} at {ward}",
        description=f"Severe {category} reported. Emergency EOC response required.",
        category=category,
        severity=severity,
        latitude=lat,
        longitude=lon,
        image_path="/uploads/demo_placeholder.jpg",
        status=status,
        is_civic_issue=False,
        ward=ward,
        department=None,
        estimated_resolution=None,
        created_at=created_at,
        updated_at=created_at + timedelta(hours=random.randint(0, 2))
    )
    
    analysis_id = str(uuid4())
    analysis = Analysis(
        id=analysis_id,
        incident_id=incident_id,
        model_name="YOLOv11-Disaster",
        model_version="1.0.0",
        status=AnalysisStatus.COMPLETED,
        prediction_json={
            "detections": [{"label": "emergency", "confidence": round(random.uniform(0.8, 0.99), 2), "bbox": [0, 0, 200, 200]}],
            "severity": severity,
            "inference_ms": 312.7,
            "image_width": 640,
            "image_height": 480,
        },
        processing_time=312.7,
        created_at=created_at + timedelta(minutes=random.randint(1, 5))
    )
    
    llm = LLMAnalysis(
        id=str(uuid4()),
        incident_id=incident_id,
        provider="gemini",
        model="gemini-1.5-flash",
        prompt_version="v1",
        summary=f"Critical {category} detected. Evacuation and rapid response necessary.",
        risk_level=severity,
        recommendations=["Deploy EOC units", "Dispatch Ambulances", "Establish Perimeter"],
        services=["Telangana Fire Services", "Hyderabad Traffic Police"],
        warning="EMERGENCY ALERT: Immediate action required.",
        response_time=1.23,
        token_usage={"prompt_token_count": 480, "candidates_token_count": 210, "total_token_count": 690},
        created_at=created_at + timedelta(minutes=random.randint(1, 5))
    )
    
    agents = []
    ag_data = {
        "assessment": {"disaster_type": category, "confidence": "95%", "affected_area": "1 sq km"},
        "risk": {"risk_level": severity, "potential_casualties": "Unknown", "property_damage": "High"},
        "coordinator": {"recommended_agencies": ["Telangana Fire Services", "Hyderabad Traffic Police"]},
    }
    
    for agent_type, payload in [("Disaster Assessment Agent", ag_data["assessment"]), ("Risk Assessment Agent", ag_data["risk"]), ("Emergency Coordinator Agent", ag_data["coordinator"])]:
        agents.append(AgentResponse(
            id=str(uuid4()),
            incident_id=incident_id,
            agent_type=agent_type,
            status="completed",
            payload=payload,
            created_at=created_at + timedelta(minutes=random.randint(1, 5))
        ))
    
    return incident, analysis, llm, agents

def run_seed():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    logger.info("Connecting to database...")
    db = SessionLocal()
    try:
        logger.info("Clearing existing demo data...")
        db.query(AgentResponse).delete()
        db.query(LLMAnalysis).delete()
        db.query(Analysis).delete()
        db.query(Incident).delete()
        db.commit()

        logger.info("Seeding 60 Civic Issues (Strict Coordinates)...")
        for _ in range(60):
            inc, ana, llm, agents = create_civic_issue()
            db.add(inc)
            db.add(ana)
            db.add(llm)
            for ag in agents:
                db.add(ag)
            
        logger.info("Seeding 30 Disaster Incidents (Strict Coordinates)...")
        for _ in range(30):
            inc, ana, llm, agents = create_disaster_issue()
            db.add(inc)
            db.add(ana)
            db.add(llm)
            for ag in agents:
                db.add(ag)

        db.commit()
        logger.info("Successfully seeded 90 records for Hyderabad EOC Demo!")

    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
