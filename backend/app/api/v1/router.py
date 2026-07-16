from fastapi import APIRouter

from app.api.v1.routes.ai_health import router as ai_health_router
from app.api.v1.routes.dashboard import router as dashboard_router
from app.api.v1.routes.health import router as health_router
from app.api.v1.routes.incidents import router as incidents_router
from app.api.v1.routes.map import router as map_router
from app.api.v1.routes.notifications import router as notifications_router
from app.api.v1.routes.ws import router as ws_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(incidents_router, tags=["incidents"])
api_router.include_router(ai_health_router, tags=["ai"])
api_router.include_router(dashboard_router, tags=["dashboard"])
api_router.include_router(map_router, tags=["map"])
api_router.include_router(notifications_router, tags=["notifications"])
api_router.include_router(ws_router, tags=["websockets"])

