"""Lucid API — FastAPI application entrypoint."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.api.runs import router as runs_router
from app.api.hallucinations import router as hallucinations_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:  # type: ignore[type-arg]
    """Application startup and shutdown lifecycle."""
    # Startup: verify connections and create tables
    app.state.services = {}

    # Check database and auto-create tables
    try:
        # Import all models so Base.metadata knows about them
        from app.models.trace import Run, TraceStep  # noqa: F401
        from app.models.hallucination import Claim, VerificationResult  # noqa: F401

        # Create all tables if they don't exist
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Verify connection with a simple query
        async with engine.connect() as conn:
            from sqlalchemy import text
            await conn.execute(text("SELECT 1"))

        app.state.services["database"] = "connected"
    except Exception as e:
        app.state.services["database"] = f"error: {e}"

    # Check Redis
    try:
        r = aioredis.from_url(settings.redis_url)
        await r.ping()
        await r.aclose()
        app.state.services["redis"] = "connected"
    except Exception:
        app.state.services["redis"] = "unavailable"

    # ChromaDB check deferred to first use
    app.state.services["chromadb"] = "deferred"

    yield

    # Shutdown
    await engine.dispose()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        description="Hallucination Auditor for Self-Orchestrating AI Agents",
        version=settings.app_version,
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health check
    @app.get("/health", tags=["system"])
    async def health_check() -> dict:
        return {
            "status": "ok",
            "version": settings.app_version,
            "services": getattr(app.state, "services", {}),
        }

    # Register routers
    app.include_router(runs_router)
    app.include_router(hallucinations_router)

    return app


app = create_app()
