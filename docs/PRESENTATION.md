# DisasterAI — Presentation Script

**Duration:** 4 minutes 30 seconds  
**Speaker:** Team lead  
**Mode:** Automated via pre-seeded demo data  

---

## Opening (0:00 – 0:30)

*Open the landing page.*

> "Every second counts when disaster strikes. When a building collapses, a fire spreads, or a flood sweeps through a city — emergency dispatchers need clarity immediately. Today we present DisasterAI: an intelligent multi-agent platform that transforms a disaster photograph into a fully coordinated emergency response in under 10 seconds."

---

## Step 1 — The Dashboard (0:30 – 1:00)

*Navigate to the Dashboard.*

> "Here's our command center. You can see 10 active incidents already reported, their severity distribution, category breakdown, and a 7-day trend chart. Every metric is live — powered by real PostgreSQL queries aggregated on the backend."

*Point to the map tab.*

> "The live map shows every incident clustered geographically. Let me click into our most critical one."

---

## Step 2 — YOLO Detection (1:00 – 1:45)

*Click on the Residential Apartment Fire incident.*

> "The moment this image was uploaded, our YOLOv11 computer vision model detected the exact bounding boxes of the fire, structural damage, and exposed hazard zones. These aren't keywords — they're spatial coordinates that inform the downstream AI agents. Notice the red overlay drawn precisely on the affected region."

---

## Step 3 — Multi-Agent Coordination (1:45 – 3:00)

*Scroll to the AI Coordination Panel.*

> "This is where DisasterAI goes beyond a single chatbot. We deploy a 5-agent Emergency Operations Center."

*Point to each card.*

> "The **Assessment Agent** confirmed this is a Fire incident with 95% confidence affecting a 2.5km radius. The **Risk Agent** calculated High severity with 5–15 potential casualties. The **Coordinator** recommended Fire Department, Ambulance, and Police. The **Advisory Agent** drafted a public evacuation notice ready for broadcast. And the **Resource Planning Agent** told our dispatchers exactly what to deploy: 4 fire trucks, 6 ambulances, 12 medical staff."

> "These aren't generic responses — each agent writes structured data to its own database row, creating a full audit trail."

---

## Step 4 — Emergency Workflow (3:00 – 3:30)

*Scroll to Workflow Actions. Click "Dispatch".*

> "A responder hits Dispatch. The incident status updates instantly. A notification fires through our WebSocket connection to all connected clients — watch the bell icon in the top right."

---

## Step 5 — Map & Wrap-up (3:30 – 4:00)

*Navigate to the Emergency Map.*

> "Back on the map, the incident is now marked as dispatched. Filters let command center staff focus on active critical incidents or view resolved ones for reporting."

---

## Closing (4:00 – 4:30)

*Return to Dashboard.*

> "DisasterAI is production-ready. It runs entirely in Docker with a single command. It degrades gracefully without an API key. It has 14 passing tests and full Swagger documentation. But most importantly, it gives emergency responders the one thing they need most: clarity under pressure. Thank you."

---

*[End demo]*
