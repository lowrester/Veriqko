"""Veriqko API - Main application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from veriqko.config import get_settings
from veriqko.errors.exceptions import VeriqkoError

# Import all models to ensure SQLAlchemy registration
import veriqko.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    settings = get_settings()

    # Ensure storage directories exist
    settings.storage_base_path.mkdir(parents=True, exist_ok=True)
    (settings.storage_base_path / "evidence").mkdir(exist_ok=True)
    (settings.storage_base_path / "reports").mkdir(exist_ok=True)

    yield

    # Shutdown
    pass


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Veriqko API",
        description="Console Verification Platform API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/api/docs" if settings.debug else None,
        redoc_url="/api/redoc" if settings.debug else None,
    )

    @app.exception_handler(VeriqkoError)
    async def veriqko_exception_handler(request: Request, exc: VeriqkoError):
        """Handle custom application exceptions."""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "message": exc.message,
                "error_code": exc.error_code,
                "details": exc.details,
            },
        )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    from veriqko.auth.router import router as auth_router
    from veriqko.evidence.router import evidence_router, router as evidence_job_router
    from veriqko.jobs.router import router as jobs_router
    from veriqko.reports.router import public_router, router as reports_router
    from veriqko.users.router import router as users_router
    from veriqko.devices.router import router as devices_router
    from veriqko.templates.router import router as templates_router
    from veriqko.stations.router import router as stations_router
    from veriqko.printing.router import router as printing_router
    from veriqko.printing.printers_router import router as printers_router
    from veriqko.stats.router import router as stats_router
    from veriqko.settings.router import router as settings_router
    from veriqko.integrations.router import router as integrations_router
    from veriqko.parts.router import router as parts_router
    from veriqko.system.router import router as system_router

    # API v1 routes
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(users_router, prefix="/api/v1")
    app.include_router(jobs_router, prefix="/api/v1")
    app.include_router(evidence_job_router, prefix="/api/v1")
    app.include_router(evidence_router, prefix="/api/v1")
    app.include_router(reports_router, prefix="/api/v1")
    app.include_router(devices_router, prefix="/api/v1")
    app.include_router(templates_router, prefix="/api/v1")
    app.include_router(stations_router, prefix="/api/v1")
    app.include_router(printing_router, prefix="/api/v1")
    app.include_router(printers_router, prefix="/api/v1")
    app.include_router(stats_router, prefix="/api/v1")
    app.include_router(settings_router, prefix="/api/v1")
    app.include_router(integrations_router, prefix="/api/v1")
    app.include_router(parts_router, prefix="/api/v1")
    app.include_router(system_router, prefix="/api/v1")

    # Public routes (no /api/v1 prefix)
    app.include_router(public_router)

    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "version": "0.1.0"}

    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "name": settings.brand_name,
            "api": f"{settings.base_url}/api/v1",
            "docs": f"{settings.base_url}/api/docs" if settings.debug else None,
        }

    return app


# Create app instance
app = create_app()
