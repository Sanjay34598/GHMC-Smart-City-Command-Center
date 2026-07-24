# CityPulse AI — Judge Guide

Welcome. This guide summarizes the technical achievements and judging evidence.

## Quick Summary

CityPulse AI is an **end-to-end, production-grade** AI emergency coordination platform. It converts a disaster photo into a structured multi-agent response in seconds.

## Evidence by Judging Criterion

### Innovation (20 pts)
- **Multi-Agent EOC simulation** — 5 specialized AI agents working in concert is novel in open-source disaster response tooling.
- **Multimodal pipeline** — fuses computer vision (YOLO bounding boxes) with language model semantic reasoning (Gemini) in a single workflow.

### Technical Complexity (20 pts)
- FastAPI async backend with full dependency injection, service-layer architecture, and repository pattern.
- SQLAlchemy 2.0 with typed ORM models and JSONB columns (GIN-indexed for future aggregation queries).
- WebSocket manager for real-time broadcast — verified with the `ws/incidents` endpoint.
- YOLOv11 ONNX inference with graceful fallback to a mock detector — zero-crash guarantee.
- Pydantic v2 strict validation on every endpoint — rejects bad inputs with appropriate 4xx status codes.

### AI Usage (20 pts)
- **YOLOv11** (Computer Vision): Object detection with bounding boxes drawn directly on the incident image.
- **Google Gemini** (LLM): Generates emergency summary, risk level, recommended actions, and public warning.
- **5-Agent Coordination**: Assessment → Risk → Coordinator → Advisory → Resources. Each agent writes structured JSONB to its own database row.
- Retry logic + fallback mode — the system degrades gracefully without any API key.

### UI/UX (15 pts)
- Framer Motion animations on every page transition and AI card reveal.
- Skeleton loaders prevent layout shift while data loads.
- Dark-mode-only design with a curated `slate` + `cyan` + `emerald` palette.
- Leaflet map with `react-leaflet-cluster` prevents marker overlap.
- Responsive layout (Tailwind `lg:` breakpoints) tested on 1920px and 375px viewports.

### Real-world Impact (15 pts)
- Dispatch / Resolve workflow mirrors the status lifecycle used by real ICS (Incident Command Systems).
- Resource Planning Agent outputs exact logistics counts (fire trucks, ambulances, medical staff).
- Public Advisory Agent generates citizen-facing warnings ready for broadcast.
- All data persisted in Postgres — supports audit trails for post-incident review.

### Scalability (10 pts)
- Stateless FastAPI backend — horizontally scalable behind a load balancer.
- Docker Compose orchestration included — `docker compose up --build` runs everything.
- Postgres with JSONB (GIN-indexable) — dashboard aggregations are single-query without an additional data warehouse.
- WebSocket manager is ready to be upgraded to Redis Pub/Sub for multi-node deployments.

## Test Evidence

```
pytest -v
14 passed in 28.82s
```

All tests use dependency injection overrides — zero external services required.

## API Documentation

Live Swagger UI available at: `http://localhost:8000/docs`

Every endpoint has a summary, response model, and example response body.
