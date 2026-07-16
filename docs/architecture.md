# DisasterAI — Architecture

## System Overview

DisasterAI is built with a decoupled, three-tier architecture optimised for AI-heavy, event-driven workflows.

```
┌────────────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                          │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │ HomePage │ │Dashboard │ │ Map View │ │  IncidentDetail   │  │
│  └──────────┘ └──────────┘ └──────────┘ └─────────┬────────┘  │
│                                                     │           │
│                         Axios HTTP / WebSocket      │           │
└─────────────────────────────────────────────────────┼──────────┘
                                                      │
┌─────────────────────────────────────────────────────▼──────────┐
│                       FastAPI (Python 3.12)                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  API Router  /api/v1                       │  │
│  │  /incidents  /dashboard  /map  /ws/incidents  /ai-health  │  │
│  └────┬──────────┬───────────────────────────────┬──────────┘  │
│       │          │                               │              │
│  ┌────▼───┐ ┌────▼─────┐                  ┌─────▼──────────┐  │
│  │AIService│ │LLMService│                  │Notification    │  │
│  │YOLOv11 │ │Gemini    │                  │Service +       │  │
│  │+Mock   │ │+Fallback │                  │WebSocket Mgr   │  │
│  └────────┘ │5-Agent   │                  └────────────────┘  │
│             │EOC Sim   │                                       │
│             └──────────┘                                       │
└──────────────────────────┬─────────────────────────────────────┘
                           │ SQLAlchemy ORM (psycopg3)
┌──────────────────────────▼─────────────────────────────────────┐
│                     PostgreSQL 16                                │
│  incidents │ analyses │ llm_analyses │ agent_responses          │
│  notifications                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### `incidents`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID | Primary key |
| `title` | VARCHAR(160) | Required |
| `category` | VARCHAR(32) | Fire, Flood, Earthquake, etc. |
| `severity` | VARCHAR(16) | Low / Medium / High |
| `latitude`, `longitude` | FLOAT | WGS-84 coordinates |
| `image_path` | VARCHAR(512) | Relative path in `uploads/` |
| `status` | VARCHAR(32) | reported → dispatched → resolved |

### `analyses` (YOLO)
| Column | Type | Notes |
| :--- | :--- | :--- |
| `prediction_json` | JSONB | Detections, bboxes, severity |
| `processing_time` | FLOAT | Milliseconds |

### `llm_analyses` (Gemini)
| Column | Type | Notes |
| :--- | :--- | :--- |
| `summary` | TEXT | Narrative risk assessment |
| `risk_level` | VARCHAR(32) | Low/Medium/High/Critical |
| `recommendations` | JSONB | List of action items |
| `services` | JSONB | Required emergency services |

### `agent_responses` (Multi-Agent)
| Column | Type | Notes |
| :--- | :--- | :--- |
| `agent_type` | VARCHAR(64) | "Disaster Assessment Agent" etc. |
| `status` | VARCHAR(32) | thinking → completed |
| `payload` | JSONB | Agent-specific structured output |

## Multi-Agent Pipeline

```
Incident Image Uploaded
       │
       ▼
YOLODetector.predict(image_bytes)  → bounding boxes + labels
       │
       ▼
SeverityEngine.compute(detections) → severity score
       │
       ▼
GeminiClient.generate_emergency_assessment(prompt) → structured JSON
       │
       ▼
LLMService.simulate_multi_agent_coordination(incident)
       ├──► Agent 1: Disaster Assessment Agent
       ├──► Agent 2: Risk Assessment Agent
       ├──► Agent 3: Emergency Coordinator Agent
       ├──► Agent 4: Public Advisory Agent
       └──► Agent 5: Resource Planning Agent → stored in agent_responses
               │
               ▼
       NotificationService.trigger_event() → WebSocket broadcast
               │
               ▼
         Browser UI updates in real time
```

## Technology Stack

| Technology | Version | Reason |
| :--- | :--- | :--- |
| FastAPI | 0.115 | Async, auto-docs, Pydantic |
| SQLAlchemy | 2.x | Type-safe ORM |
| psycopg3 | 3.2 | Modern Postgres driver |
| Ultralytics (YOLO) | 8.3 | State-of-the-art object detection |
| google-genai | 0.2 | Official Gemini SDK |
| React | 18 | Concurrent rendering, hooks |
| Vite | 8 | Fast HMR, Rollup builds |
| Tailwind CSS | 3.4 | Consistent dark theme |
| Framer Motion | latest | Smooth animations |
| Leaflet | 1.9 | OpenStreetMap, no API key |
