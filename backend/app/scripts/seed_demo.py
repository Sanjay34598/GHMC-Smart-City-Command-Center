"""Demo seed script — populates the database with 10 realistic disaster scenarios.

Usage:
    cd backend
    python -m app.scripts.seed_demo

Requires:
    - A running PostgreSQL database (tables are auto-created)
    - .env configured (or environment variables set)

This is safe to run multiple times — it clears previous demo data first.
"""
import sys
import logging
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger("seed_demo")

# Ensure the backend/ directory is on the path when run as a module
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from app.db.session import SessionLocal  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.modules.incidents.models import Incident  # noqa: E402
from app.modules.analyses.models import Analysis, AnalysisStatus  # noqa: E402
from app.llm.models import LLMAnalysis, AgentResponse  # noqa: E402


# ---------------------------------------------------------------------------
# Demo scenario definitions
# ---------------------------------------------------------------------------

SCENARIOS = [
    {
        "title": "Residential Apartment Fire — Dharavi",
        "description": "A severe fire has broken out in a 4-storey residential building. Multiple floors are engulfed and residents are trapped.",
        "category": "Fire",
        "severity": "High",
        "latitude": 19.0390,
        "longitude": 72.8527,
        "status": "dispatched",
        "yolo": {
            "detections": [
                {"label": "fire", "confidence": 0.97, "bbox": [80, 60, 420, 380]},
                {"label": "smoke", "confidence": 0.91, "bbox": [60, 20, 500, 200]},
                {"label": "person", "confidence": 0.83, "bbox": [200, 300, 280, 450]},
            ],
            "severity": "High",
        },
        "gemini": {
            "summary": "A major residential fire is consuming a multi-storey apartment building. Structural integrity is compromised. Multiple casualties reported.",
            "risk_level": "Critical",
            "recommendations": ["Immediate evacuation of adjacent buildings", "Deploy aerial ladder unit", "Establish perimeter 200m"],
            "services": ["Fire Department", "Ambulance", "Police", "NDRF"],
            "warning": "EMERGENCY: Evacuate the area immediately. Avoid Dharavi Link Road.",
        },
        "agents": {
            "assessment": {"disaster_type": "Residential Fire", "confidence": "97%", "affected_area": "3.2 sq km"},
            "risk": {"risk_level": "Critical", "potential_casualties": "20-40", "property_damage": "Severe structural loss", "infrastructure_impact": "Gas lines and power grid at risk"},
            "coordinator": {"recommended_agencies": ["Fire Department", "NDRF", "Ambulance", "Police", "Electricity Board"]},
            "advisory": {"citizen_warning": "Evacuate immediately via Western Express Highway.", "evacuation_message": "Proceed to evacuation point at Dharavi High School.", "safety_precautions": "Do not use elevators. Cover nose with cloth.", "travel_advisory": "Avoid Sion-Dharavi Road."},
            "resources": {"fire_trucks": 8, "ambulances": 10, "police_units": 6, "medical_staff": 25, "rescue_teams": 4},
        },
    },
    {
        "title": "Chemical Plant Explosion — Taloja MIDC",
        "description": "An explosion at a chemical manufacturing unit has triggered a toxic gas leak. Thick black smoke visible 10km away.",
        "category": "Fire",
        "severity": "High",
        "latitude": 19.0246,
        "longitude": 73.1339,
        "status": "reported",
        "yolo": {
            "detections": [
                {"label": "fire", "confidence": 0.99, "bbox": [50, 30, 580, 400]},
                {"label": "smoke", "confidence": 0.98, "bbox": [0, 0, 640, 250]},
                {"label": "vehicle", "confidence": 0.72, "bbox": [350, 350, 500, 450]},
            ],
            "severity": "High",
        },
        "gemini": {
            "summary": "A catastrophic explosion at Taloja MIDC chemical complex has caused uncontrolled fire and toxic gas release. Evacuation of a 5km radius is critical.",
            "risk_level": "Critical",
            "recommendations": ["Hazmat team deployment", "5km evacuation radius", "Wind direction monitoring"],
            "services": ["Fire Department", "Hazmat Unit", "Ambulance", "Police", "NDRF"],
            "warning": "HAZMAT ALERT: Toxic gas release detected. Evacuate 5km radius immediately.",
        },
        "agents": {
            "assessment": {"disaster_type": "Chemical Fire/Explosion", "confidence": "99%", "affected_area": "5 sq km"},
            "risk": {"risk_level": "Critical", "potential_casualties": "50-200", "property_damage": "Total plant loss, neighbouring damage", "infrastructure_impact": "Road closures, water supply contamination risk"},
            "coordinator": {"recommended_agencies": ["Fire Department", "Hazmat Unit", "NDRF", "Ambulance", "Police", "Water Authority"]},
            "advisory": {"citizen_warning": "Toxic gas leak. Stay indoors, seal windows with wet cloth.", "evacuation_message": "5km radius must evacuate now via NH-4.", "safety_precautions": "Do not light flames. Use N95 mask.", "travel_advisory": "Taloja-Panvel Road is closed."},
            "resources": {"fire_trucks": 12, "ambulances": 20, "police_units": 10, "medical_staff": 50, "rescue_teams": 6},
        },
    },
    {
        "title": "Highway Pile-up — Delhi-Agra Expressway",
        "description": "A 15-vehicle pile-up on the Delhi-Agra Expressway in foggy conditions. Multiple people trapped in vehicles.",
        "category": "Road Accident",
        "severity": "Medium",
        "latitude": 28.3908,
        "longitude": 77.3230,
        "status": "resolved",
        "yolo": {
            "detections": [
                {"label": "vehicle", "confidence": 0.96, "bbox": [30, 200, 300, 420]},
                {"label": "vehicle", "confidence": 0.94, "bbox": [250, 180, 550, 400]},
                {"label": "person", "confidence": 0.88, "bbox": [140, 350, 200, 470]},
                {"label": "fire", "confidence": 0.61, "bbox": [480, 300, 620, 450]},
            ],
            "severity": "Medium",
        },
        "gemini": {
            "summary": "Multi-vehicle collision on Delhi-Agra Expressway has caused significant casualties and traffic disruption. One vehicle is on fire.",
            "risk_level": "High",
            "recommendations": ["Jaws of life deployment", "Airlift critically injured", "Traffic diversion via NH-2"],
            "services": ["Ambulance", "Police", "Fire Department", "Highway Patrol"],
            "warning": "Delhi-Agra Expressway is CLOSED at km 87. Use alternate routes.",
        },
        "agents": {
            "assessment": {"disaster_type": "Road Accident (Multi-vehicle)", "confidence": "96%", "affected_area": "1.5 km stretch"},
            "risk": {"risk_level": "High", "potential_casualties": "8-20", "property_damage": "15 vehicles damaged", "infrastructure_impact": "Highway blocked"},
            "coordinator": {"recommended_agencies": ["Ambulance", "Police", "Fire Department", "Highway Patrol"]},
            "advisory": {"citizen_warning": "Avoid Delhi-Agra Expressway.", "evacuation_message": "No evacuation needed. Stay clear of accident site.", "safety_precautions": "Do not approach vehicles on fire.", "travel_advisory": "Use NH-2 alternate route via Palwal."},
            "resources": {"fire_trucks": 2, "ambulances": 8, "police_units": 10, "medical_staff": 15, "rescue_teams": 3},
        },
    },
    {
        "title": "Bridge Structural Damage — Howrah",
        "description": "Cracks observed in the support pillars of a major bridge. Heavy truck traffic has been halted. Structural engineer on site.",
        "category": "Building Collapse",
        "severity": "High",
        "latitude": 22.5851,
        "longitude": 88.3468,
        "status": "reported",
        "yolo": {
            "detections": [
                {"label": "damaged structure", "confidence": 0.89, "bbox": [100, 150, 500, 400]},
                {"label": "vehicle", "confidence": 0.76, "bbox": [200, 350, 380, 470]},
            ],
            "severity": "High",
        },
        "gemini": {
            "summary": "Structural cracks in the bridge pillars indicate imminent failure risk. Immediate closure and evacuation of the bridge deck is required.",
            "risk_level": "High",
            "recommendations": ["Immediate closure to all traffic", "Structural assessment within 2 hours", "Deploy riverine rescue units"],
            "services": ["Police", "Municipal Corporation", "Structural Engineers", "Riverine Rescue"],
            "warning": "BRIDGE CLOSED: Do not attempt to cross. Immediate structural risk.",
        },
        "agents": {
            "assessment": {"disaster_type": "Bridge Structural Failure", "confidence": "89%", "affected_area": "500m radius"},
            "risk": {"risk_level": "High", "potential_casualties": "0-50 if collapses", "property_damage": "Bridge infrastructure at total loss risk", "infrastructure_impact": "Major river crossing disrupted"},
            "coordinator": {"recommended_agencies": ["Police", "Municipal Corporation", "PWD", "Riverine Rescue"]},
            "advisory": {"citizen_warning": "Do not cross Howrah Bridge. Divert via Vidyasagar Setu.", "evacuation_message": "All personnel on bridge must evacuate.", "safety_precautions": "Stay away from the riverbank below the bridge.", "travel_advisory": "Use Bally Bridge or Vidyasagar Setu."},
            "resources": {"fire_trucks": 1, "ambulances": 4, "police_units": 15, "medical_staff": 8, "rescue_teams": 5},
        },
    },
    {
        "title": "Industrial Area Flooding — Kolkata",
        "description": "Severe flooding in the Tangra industrial area following overnight rainfall. Factories are submerged to 4 feet.",
        "category": "Flood",
        "severity": "High",
        "latitude": 22.5471,
        "longitude": 88.3903,
        "status": "reported",
        "yolo": {
            "detections": [
                {"label": "flood", "confidence": 0.93, "bbox": [0, 200, 640, 480]},
                {"label": "vehicle", "confidence": 0.80, "bbox": [100, 300, 280, 440]},
                {"label": "person", "confidence": 0.77, "bbox": [320, 250, 400, 430]},
            ],
            "severity": "High",
        },
        "gemini": {
            "summary": "Severe urban flooding has submerged the Tangra industrial zone. Workers are stranded on rooftops. Chemical runoff risk from factories is critical.",
            "risk_level": "High",
            "recommendations": ["Deploy boats for rescue", "Chemical runoff containment", "Temporary shelter for displaced workers"],
            "services": ["NDRF", "Municipal Corporation", "Ambulance", "Water Authority"],
            "warning": "Tangra industrial area is flooded. Avoid all roads in the zone.",
        },
        "agents": {
            "assessment": {"disaster_type": "Urban Industrial Flood", "confidence": "93%", "affected_area": "4 sq km"},
            "risk": {"risk_level": "High", "potential_casualties": "10-30", "property_damage": "Severe machinery and inventory loss", "infrastructure_impact": "Power grid and water mains compromised"},
            "coordinator": {"recommended_agencies": ["NDRF", "Municipal Corporation", "Ambulance", "Water Authority", "Electricity Board"]},
            "advisory": {"citizen_warning": "Avoid Tangra. Roads are impassable.", "evacuation_message": "Workers must move to upper floors and signal for rescue.", "safety_precautions": "Do not walk through floodwater. Chemical contamination risk.", "travel_advisory": "Avoid Topsia Road and Tangra Road."},
            "resources": {"fire_trucks": 2, "ambulances": 6, "police_units": 8, "medical_staff": 12, "rescue_teams": 10},
        },
    },
    {
        "title": "Residential Building Collapse — Hyderabad",
        "description": "A 5-storey under-construction building has partially collapsed trapping workers. Cries for help audible under rubble.",
        "category": "Building Collapse",
        "severity": "High",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "status": "dispatched",
        "yolo": {
            "detections": [
                {"label": "damaged structure", "confidence": 0.95, "bbox": [50, 50, 580, 430]},
                {"label": "person", "confidence": 0.84, "bbox": [200, 380, 260, 470]},
            ],
            "severity": "High",
        },
        "gemini": {
            "summary": "A major building collapse has trapped multiple construction workers under debris. Immediate heavy rescue operation required.",
            "risk_level": "Critical",
            "recommendations": ["Deploy USAR team", "Acoustic detection devices", "Medical triage on site"],
            "services": ["NDRF", "Fire Department", "Ambulance", "Police"],
            "warning": "Building collapse at Gachibowli. Avoid area. Emergency services deployed.",
        },
        "agents": {
            "assessment": {"disaster_type": "Building Collapse", "confidence": "95%", "affected_area": "200m radius"},
            "risk": {"risk_level": "Critical", "potential_casualties": "15-30", "property_damage": "Total structure loss", "infrastructure_impact": "Water and electrical lines severed"},
            "coordinator": {"recommended_agencies": ["NDRF", "Fire Department", "Ambulance", "Police", "Municipal Corporation"]},
            "advisory": {"citizen_warning": "Stay away from Gachibowli site. Aftershock risk.", "evacuation_message": "Evacuate adjacent buildings.", "safety_precautions": "Do not enter unstable structures.", "travel_advisory": "Avoid Gachibowli Road."},
            "resources": {"fire_trucks": 4, "ambulances": 12, "police_units": 8, "medical_staff": 20, "rescue_teams": 8},
        },
    },
    {
        "title": "Forest Fire — Shimla Hills",
        "description": "An uncontrolled forest fire is spreading through the pine forests on the Shimla-Chail highway. Visibility severely reduced.",
        "category": "Fire",
        "severity": "Medium",
        "latitude": 31.1048,
        "longitude": 77.1734,
        "status": "reported",
        "yolo": {
            "detections": [
                {"label": "fire", "confidence": 0.92, "bbox": [0, 100, 640, 480]},
                {"label": "smoke", "confidence": 0.97, "bbox": [0, 0, 640, 300]},
            ],
            "severity": "Medium",
        },
        "gemini": {
            "summary": "A forest fire is spreading rapidly in dry pine forest conditions. Villages downwind are at immediate risk of ember shower.",
            "risk_level": "High",
            "recommendations": ["Air-drop water tankers", "Establish firebreak", "Evacuate villages within 3km"],
            "services": ["Fire Department", "Forest Department", "NDRF", "Army"],
            "warning": "Shimla-Chail highway closed. Forest fire risk to nearby villages.",
        },
        "agents": {
            "assessment": {"disaster_type": "Forest/Wildfire", "confidence": "92%", "affected_area": "8 sq km and expanding"},
            "risk": {"risk_level": "High", "potential_casualties": "0-10", "property_damage": "Timber and wildlife habitat loss", "infrastructure_impact": "Highway and power lines at risk"},
            "coordinator": {"recommended_agencies": ["Forest Department", "Fire Department", "NDRF", "Army Aviation"]},
            "advisory": {"citizen_warning": "Evacuate villages: Kufri, Chail. Embers pose fire risk.", "evacuation_message": "Proceed to Shimla city evacuation centre.", "safety_precautions": "Use N95 mask. Keep animals indoors.", "travel_advisory": "Shimla-Chail highway is closed."},
            "resources": {"fire_trucks": 6, "ambulances": 3, "police_units": 4, "medical_staff": 6, "rescue_teams": 5},
        },
    },
    {
        "title": "Gas Pipeline Leak — Electronic City",
        "description": "A high-pressure gas pipeline has ruptured near Electronic City Phase 2. Strong smell of gas reported over 500m radius.",
        "category": "Other",
        "severity": "High",
        "latitude": 12.8449,
        "longitude": 77.6641,
        "status": "reported",
        "yolo": {
            "detections": [
                {"label": "smoke", "confidence": 0.71, "bbox": [200, 250, 450, 420]},
                {"label": "vehicle", "confidence": 0.85, "bbox": [50, 350, 200, 480]},
            ],
            "severity": "High",
        },
        "gemini": {
            "summary": "A ruptured high-pressure gas main is releasing flammable gas in a densely populated tech zone. Explosion risk is extreme if ignition occurs.",
            "risk_level": "Critical",
            "recommendations": ["Shut off gas main immediately", "Evacuate 1km radius", "No open flames or electrical switches in zone"],
            "services": ["Gas Authority", "Fire Department", "Police", "Electricity Board"],
            "warning": "GAS LEAK: Evacuate 1km radius of Electronic City Phase 2 now. No flames.",
        },
        "agents": {
            "assessment": {"disaster_type": "Gas Pipeline Rupture", "confidence": "71%", "affected_area": "1 sq km"},
            "risk": {"risk_level": "Critical", "potential_casualties": "0-100 if ignition", "property_damage": "Massive blast radius if ignited", "infrastructure_impact": "Power cutoff required in zone"},
            "coordinator": {"recommended_agencies": ["GAIL", "Fire Department", "Police", "Electricity Board", "Ambulance"]},
            "advisory": {"citizen_warning": "Do NOT light any flames. Do NOT use electrical switches.", "evacuation_message": "Leave Electronic City Phase 2 immediately on foot.", "safety_precautions": "Leave windows open. Do not use vehicles if possible.", "travel_advisory": "Avoid Hosur Road near Electronic City."},
            "resources": {"fire_trucks": 6, "ambulances": 8, "police_units": 12, "medical_staff": 15, "rescue_teams": 2},
        },
    },
    {
        "title": "Mountain Landslide — Darjeeling",
        "description": "Heavy monsoon rains have triggered a major landslide on the Siliguri-Darjeeling highway. Several vehicles buried. Road completely blocked.",
        "category": "Landslide",
        "severity": "Medium",
        "latitude": 27.0360,
        "longitude": 88.2627,
        "status": "reported",
        "yolo": {
            "detections": [
                {"label": "damaged structure", "confidence": 0.88, "bbox": [0, 150, 640, 480]},
                {"label": "vehicle", "confidence": 0.79, "bbox": [100, 380, 280, 470]},
            ],
            "severity": "Medium",
        },
        "gemini": {
            "summary": "A massive landslide has buried the Siliguri-Darjeeling highway under tons of debris. Multiple vehicles are trapped. Further slides are likely.",
            "risk_level": "High",
            "recommendations": ["Heavy machinery for debris clearance", "Search for trapped survivors", "Monitor for secondary slides"],
            "services": ["NDRF", "BRO", "Police", "Ambulance"],
            "warning": "NH-110 Siliguri-Darjeeling road is closed due to landslide. No alternate route available.",
        },
        "agents": {
            "assessment": {"disaster_type": "Mountain Landslide", "confidence": "88%", "affected_area": "500m highway blockage"},
            "risk": {"risk_level": "High", "potential_casualties": "5-15", "property_damage": "Highway infrastructure and vehicles", "infrastructure_impact": "All road access to Darjeeling severed"},
            "coordinator": {"recommended_agencies": ["NDRF", "BRO", "Army", "Police", "Ambulance"]},
            "advisory": {"citizen_warning": "Do not attempt to travel to Darjeeling via NH-110.", "evacuation_message": "Tourists in Darjeeling should shelter in place.", "safety_precautions": "Stay away from hillsides. Secondary slide risk is high.", "travel_advisory": "No road access. Helicopter transfer arranged for emergencies."},
            "resources": {"fire_trucks": 1, "ambulances": 5, "police_units": 8, "medical_staff": 10, "rescue_teams": 6},
        },
    },
    {
        "title": "Electrical Substation Fire — Sarkhej",
        "description": "A 220kV electrical substation in Sarkhej has caught fire. Power supply disrupted to 4 residential zones.",
        "category": "Fire",
        "severity": "High",
        "latitude": 22.9959,
        "longitude": 72.5014,
        "status": "reported",
        "yolo": {
            "detections": [
                {"label": "fire", "confidence": 0.94, "bbox": [150, 100, 500, 380]},
                {"label": "smoke", "confidence": 0.96, "bbox": [100, 0, 600, 200]},
            ],
            "severity": "High",
        },
        "gemini": {
            "summary": "A fire at a major electrical substation has disrupted power to large residential and commercial areas. Explosion risk from high-voltage equipment is extreme.",
            "risk_level": "Critical",
            "recommendations": ["Isolate electrical supply immediately", "Dry-powder fire suppression only", "Evacuate 500m radius"],
            "services": ["Fire Department", "GSECL", "Police", "Ambulance"],
            "warning": "Electrical substation fire in Sarkhej. Power disruption expected 6-12 hours.",
        },
        "agents": {
            "assessment": {"disaster_type": "Electrical/Substation Fire", "confidence": "94%", "affected_area": "500m exclusion zone"},
            "risk": {"risk_level": "Critical", "potential_casualties": "2-10", "property_damage": "Substation total loss, estimated ₹50 crore", "infrastructure_impact": "Power outage for 200,000 residents"},
            "coordinator": {"recommended_agencies": ["Fire Department", "GSECL", "Police", "Ambulance", "Municipal Corporation"]},
            "advisory": {"citizen_warning": "Power outage in effect. Do not touch downed power lines.", "evacuation_message": "Evacuate within 500m of Sarkhej substation.", "safety_precautions": "Use only dry powder/CO2 extinguishers. No water near electrical fire.", "travel_advisory": "Avoid Sarkhej-Gandhinagar Highway near the substation."},
            "resources": {"fire_trucks": 5, "ambulances": 6, "police_units": 8, "medical_staff": 12, "rescue_teams": 2},
        },
    },
]


def _make_id() -> str:
    return str(uuid4())


def seed(db) -> None:  # type: ignore[no-untyped-def]
    """Delete existing demo incidents and insert 10 fresh scenarios."""

    # ── Wipe existing data in reverse FK order ──────────────────────────────
    logger.info("Clearing previous demo data…")
    db.query(AgentResponse).delete()
    db.query(LLMAnalysis).delete()
    db.query(Analysis).delete()
    db.query(Incident).delete()
    db.commit()

    base_time = datetime.now(timezone.utc) - timedelta(hours=48)

    for idx, s in enumerate(SCENARIOS):
        created_at = base_time + timedelta(hours=idx * 4)
        incident_id = _make_id()

        # ── Incident ──────────────────────────────────────────────────────
        incident = Incident(
            id=incident_id,
            title=s["title"],
            description=s["description"],
            category=s["category"],
            severity=s["severity"],
            latitude=s["latitude"],
            longitude=s["longitude"],
            image_path="uploads/demo_placeholder.jpg",
            status=s["status"],
            created_at=created_at,
            updated_at=created_at,
        )
        db.add(incident)

        # ── YOLO Analysis ─────────────────────────────────────────────────
        analysis = Analysis(
            id=_make_id(),
            incident_id=incident_id,
            model_name="YOLOv11-Disaster",
            model_version="1.0.0",
            status=AnalysisStatus.COMPLETED,
            prediction_json={
                **s["yolo"],
                "model_name": "YOLOv11-Disaster",
                "model_version": "1.0.0",
                "inference_ms": 312.7,
                "image_width": 640,
                "image_height": 480,
            },
            processing_time=312.7,
            created_at=created_at,
        )
        db.add(analysis)

        # ── Gemini LLM Analysis ───────────────────────────────────────────
        g = s["gemini"]
        llm = LLMAnalysis(
            id=_make_id(),
            incident_id=incident_id,
            provider="gemini",
            model="gemini-1.5-flash",
            prompt_version="v1",
            summary=g["summary"],
            risk_level=g["risk_level"],
            recommendations=g["recommendations"],
            services=g["services"],
            warning=g["warning"],
            response_time=1.23,
            token_usage={"prompt_token_count": 480, "candidates_token_count": 210, "total_token_count": 690},
            created_at=created_at,
        )
        db.add(llm)

        # ── Agent Responses ───────────────────────────────────────────────
        ag = s["agents"]
        for agent_type, payload in [
            ("Disaster Assessment Agent", ag["assessment"]),
            ("Risk Assessment Agent", ag["risk"]),
            ("Emergency Coordinator Agent", ag["coordinator"]),
            ("Public Advisory Agent", ag["advisory"]),
            ("Resource Planning Agent", ag["resources"]),
        ]:
            db.add(AgentResponse(
                id=_make_id(),
                incident_id=incident_id,
                agent_type=agent_type,
                status="completed",
                payload=payload,
                created_at=created_at,
            ))

        logger.info("  ✓ Scenario %d: %s", idx + 1, s["title"])

    db.commit()
    logger.info("Done. %d scenarios seeded.", len(SCENARIOS))


if __name__ == "__main__":
    # Auto-create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
