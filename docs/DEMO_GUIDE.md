# CityPulse AI — Demo Guide

## Overview

CityPulse AI includes a fully scripted demo mode designed for hackathon presentations. The application works completely offline — no API keys or internet connection required.

## Pre-Demo Setup (2 minutes)

```bash
# 1. Ensure USE_MOCK_AI=True and GEMINI_API_KEY= (empty) in .env
# 2. Start the backend
cd backend && uvicorn app.main:app --reload

# 3. Start the frontend
cd frontend && npm run dev

# 4. Seed 10 demo incidents
cd backend && python -m app.scripts.seed_demo
```

After seeding, the database will contain 10 realistic scenarios ready to present.

## Demo Scenarios

| # | Scenario | Category | Severity | Location |
| :- | :--- | :--- | :--- | :--- |
| 1 | Residential Apartment Fire | Fire | High | Mumbai |
| 2 | Chemical Plant Explosion | Fire | High | Pune |
| 3 | Highway Pile-up Accident | Road Accident | Medium | Delhi |
| 4 | Bridge Structural Damage | Building Collapse | High | Chennai |
| 5 | Industrial Flood | Flood | High | Kolkata |
| 6 | Residential Building Collapse | Building Collapse | High | Hyderabad |
| 7 | Forest Fire | Fire | Medium | Shimla |
| 8 | Gas Pipeline Leak | Other | High | Bangalore |
| 9 | Mountain Landslide | Landslide | Medium | Darjeeling |
| 10 | Electrical Substation Fire | Fire | High | Ahmedabad |

## 5-Minute Presentation Flow

```
0:00 — Open the Dashboard. Show live stats and the map with 10 incidents.
0:45 — Click into "Residential Apartment Fire". Show bounding box overlay.
1:30 — Scroll to the AI Coordination Panel. Explain the 5 agents.
2:15 — Click "Dispatch" on the Workflow Actions card. Watch status update.
3:00 — Return to Dashboard. Show the resolved incident reflected in stats.
3:30 — Open the Map tab. Demonstrate the cluster popup and incident drawer.
4:15 — Show the Notifications bell (top right). Explain WebSocket push.
4:30 — Open /docs (Swagger UI) — show the API is fully documented.
5:00 — Done.
```

## Tips for Judges

- All AI responses are pre-computed — there is no latency from external calls.
- Click any incident on the map to open its detail drawer.
- The Dispatch → Resolve workflow simulates a real EOC status lifecycle.
- The bounding-box overlay is drawn live from the stored YOLO `prediction_json` — try resizing the window.
