"""FastAPI application factory.

Startup responsibilities:
- Import all ORM models so ``Base.metadata`` is fully populated.
- Call ``create_all`` to auto-create tables in the development database.
  (Production environments should use Alembic migrations instead.)
- Mount ``/uploads`` as a static file directory so the frontend can display
  uploaded incident images directly via URL.
"""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    """Application lifespan: initialise DB tables on startup."""
    from app.modules.incidents import models as _incidents_models  # noqa: F401
    from app.modules.analyses import models as _analyses_models  # noqa: F401
    from app.llm import models as _llm_models  # noqa: F401
    from app.modules.notifications import models as _notifications_models  # noqa: F401
    from app.db.base import Base
    from app.db.session import engine

    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        # DB may be unavailable in CI / test environments.
        # Routes that require a DB session will fail at request time,
        # not at startup.
        pass
    yield


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    # Serve uploaded incident images so the frontend can display them.
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

    return app


app = create_application()
