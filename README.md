# DisasterAI

> **Intelligent disaster detection and multi-agent emergency coordination — built for the moments that matter.**

DisasterAI transforms raw disaster images into structured, actionable emergency intelligence using a multi-stage AI pipeline: YOLOv11 computer vision detects objects in the scene, Google Gemini performs semantic risk analysis, and a simulated 5-agent Emergency Operations Center (EOC) coordinates the response — all in seconds.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 📸 **Image Upload & Analysis** | Upload disaster photos; YOLO detects fires, vehicles, structures with bounding boxes |
| 🧠 **Gemini AI Summary** | LLM generates a full emergency assessment with risk level and public warning |
| 🤖 **Multi-Agent Coordination** | 5 specialized AI agents (Assessment, Risk, Coordinator, Advisory, Resources) collaborate |
| 🗺️ **Interactive Map** | Leaflet map with clustered incident markers, filters, and incident drawer |
| 📊 **Live Dashboard** | Real-time stats, severity charts, category distribution, 7-day trend |
| 🔔 **WebSocket Notifications** | Real-time push notifications when incidents are created or analyzed |
| ⚡ **Dispatch / Resolve Workflow** | Responders can change incident status with a single click |
| 🛡️ **Graceful Fallbacks** | Works without internet — YOLO falls back to mock, Gemini returns preset response |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                    │
│  HomePage │ Dashboard │ Map │ Upload │ IncidentDetail        │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP / WebSocket
┌─────────────────────────▼───────────────────────────────────┐
│                  FastAPI Backend (Python 3.12)               │
│                                                              │
│  /incidents  /dashboard  /map  /ws/incidents  /ai-health     │
│                                                              │
│  AIService ──► YOLODetector / MockDetector                   │
│  LLMService ──► GeminiClient (with retry + fallback)         │
│  LLMService ──► 5-Agent Coordinator (mock EOC simulation)    │
│  NotificationService ──► WebSocket broadcast                 │
└──────────────────┬──────────────────────────────────────────┘
                   │ SQLAlchemy / psycopg3
┌──────────────────▼──────────────────────────────────────────┐
│              PostgreSQL 16                                    │
│  incidents │ analyses │ llm_analyses │ agent_responses       │
│  notifications                                               │
└─────────────────────────────────────────────────────────────┘
```

For the full component diagram see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🚀 Quick Start

### Option A — Docker (Recommended)

```bash
# 1. Clone the repo
git clone <repo-url> disasterai && cd disasterai

# 2. Copy and configure the environment
cp .env.example .env
# Edit .env — set GEMINI_API_KEY and a strong POSTGRES_PASSWORD

# 3. Start everything
docker compose up --build

# 4. Open in browser
open http://localhost        # Frontend
open http://localhost:8000/docs  # API docs (Swagger)
```

### Option B — Local Development

#### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Copy env and configure
cp ../.env.example .env
# Edit .env with your local Postgres credentials

uvicorn app.main:app --reload
# API available at http://localhost:8000
# Swagger UI at http://localhost:8000/docs
```

#### Frontend

```bash
cd frontend

# Create frontend env file
echo "VITE_API_BASE_URL=http://localhost:8000/api/v1" > .env

npm install
npm run dev
# App available at http://localhost:5173
```

---

## 🔑 Environment Variables

| Variable | Default | Required | Description |
| :--- | :--- | :---: | :--- |
| `POSTGRES_SERVER` | `localhost` | ✅ | Postgres host |
| `POSTGRES_DB` | `disasterai` | ✅ | Database name |
| `POSTGRES_USER` | `disasterai` | ✅ | Database user |
| `POSTGRES_PASSWORD` | — | ✅ | Database password |
| `BACKEND_CORS_ORIGINS` | `http://localhost:5173` | ✅ | Comma-separated allowed origins |
| `GEMINI_API_KEY` | _(empty)_ | ❌ | Google AI API key — app works without it |
| `USE_MOCK_AI` | `False` | ❌ | Set `True` to skip real YOLO inference |
| `VITE_API_BASE_URL` | — | ✅ | Frontend `.env` only |

---

## 🧪 Running Tests

```bash
cd backend
.venv\Scripts\activate
pytest -v
```

All tests use in-memory mocks — no database or external APIs required.

---

## 📁 Repository Layout

```
disasterai/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── ai/           # YOLO detector + mock
│   │   ├── api/v1/       # Route handlers
│   │   ├── core/         # Config + WebSocket manager
│   │   ├── db/           # SQLAlchemy session + base
│   │   ├── llm/          # Gemini client, prompts, schemas
│   │   ├── modules/      # incidents, analyses, notifications
│   │   └── services/     # AIService, LLMService, NotificationService
│   ├── tests/            # Pytest test suite (14 tests)
│   └── Dockerfile
├── frontend/             # React + Vite application
│   ├── src/
│   │   ├── app/          # App.tsx (routing)
│   │   ├── components/   # Shared UI components
│   │   ├── lib/          # API client functions
│   │   ├── pages/        # Route-level pages
│   │   └── hooks/        # Custom React hooks
│   └── Dockerfile
├── docs/                 # Architecture & technical docs
├── docker-compose.yml    # Full-stack container orchestration
└── .env.example          # Environment variable reference
```

---

## 🏆 Built For HackIndia

DisasterAI was built as a demonstration of how modern AI can be applied to real-world emergency response. The project integrates multimodal AI (vision + language), a multi-agent architecture, and a production-grade full-stack to show what's possible when technology meets critical infrastructure.
