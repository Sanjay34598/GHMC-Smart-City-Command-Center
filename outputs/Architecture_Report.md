# Architecture Report

## System Architecture

The GHMC Smart City Command Center leverages a modern, decoupled stack designed for rapid iteration, high performance, and robustness during offline demonstrations.

### 1. Frontend Architecture
- **Framework**: React 18 with Vite.
- **Routing**: React Router DOM with lazy-loaded code-splitting for performance.
- **State & Data Fetching**: Axios, standard React hooks.
- **Styling**: Tailwind CSS with Framer Motion for high-fidelity micro-interactions and an EOC (Emergency Operations Center) aesthetic.
- **Visualization**: Leaflet/React-Leaflet for geospatial clustering. Recharts for statistical analytics on the dashboard.

### 2. Backend Architecture
- **Framework**: FastAPI (Python 3.12).
- **Database**: SQLite (SQLAlchemy 2.0). Originally PostgreSQL, migrated gracefully to SQLite to ensure zero-dependency offline demo capability.
- **Schemas**: Pydantic v2.
- **AI Integration**:
  - Contains mocked integrations for YOLOv11 and Gemini 1.5 Flash.
  - Multi-Agent coordination layers are modeled using SQLite JSON types, representing complex decision-making processes visually on the frontend without requiring runtime internet access.

### 3. Data Model Enhancements
- `Incident`: Expanded to include `is_civic_issue`, `ward`, `department`, and `estimated_resolution`.
- `Analysis`/`LLMAnalysis`: Swapped `JSONB` to `JSON` for strict SQLite compatibility while maintaining complex hierarchical object storage.

## Demo Flow Architecture
1. **Seeding**: The script injects highly realistic incident data, simulating AI verification and processing latency in the past.
2. **Serving**: FastAPI serves the SQLite data over local REST endpoints.
3. **Consuming**: The React frontend pulls the data, parsing the JSON blobs to render rich dashboards, maps, and specific boards like the Civic Sense Board.
