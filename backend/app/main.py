"""Lucid API — FastAPI application entrypoint."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.api.runs import router as runs_router
from app.api.hallucinations import router as hallucinations_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:  # type: ignore[type-arg]
    """Application startup and shutdown lifecycle."""
    # Startup: verify connections
    app.state.services = {}

    # Check database
    try:
        async with engine.begin() as conn:
            await conn.execute(conn.default_dialect.statement_compiler(conn.dialect, None))  # type: ignore[arg-type]
        app.state.services["database"] = "connected"
    except Exception:
        app.state.services["database"] = "unavailable"

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
