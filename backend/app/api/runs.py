"""API routes for agent runs and trace inspection."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.trace import Run, RunStatus, TraceStep
from app.schemas import RunCreate, RunDetail, RunSummary, TraceStepResponse

router = APIRouter(prefix="/api/runs", tags=["runs"])


@router.post("", response_model=RunSummary, status_code=status.HTTP_201_CREATED)
async def create_run(body: RunCreate, db: AsyncSession = Depends(get_db)) -> Run:
    """Create a new agent run. The agent will execute asynchronously via Celery."""
    run = Run(
        goal=body.goal,
        model=body.model,
        config=body.config,
        status=RunStatus.PENDING,
    )
    db.add(run)
    await db.flush()
    await db.refresh(run)

    # TODO: Phase 2 — dispatch Celery task to execute the agent
    # from app.worker.tasks import execute_agent_run
    # execute_agent_run.delay(str(run.id))

    return run


@router.get("", response_model=list[RunSummary])
async def list_runs(
    model: str | None = None,
    status_filter: RunStatus | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> list[Run]:
    """List all runs with optional filtering."""
    query = select(Run).order_by(Run.created_at.desc()).limit(limit).offset(offset)
    if model:
        query = query.where(Run.model == model)
    if status_filter:
        query = query.where(Run.status == status_filter)

    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/{run_id}", response_model=RunDetail)
async def get_run(run_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Run:
    """Get full run details including all trace steps."""
    query = (
        select(Run)
        .options(selectinload(Run.steps))
        .where(Run.id == run_id)
    )
    result = await db.execute(query)
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.get("/{run_id}/steps", response_model=list[TraceStepResponse])
async def get_run_steps(
    run_id: uuid.UUID,
    limit: int = 100,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> list[TraceStep]:
    """Get paginated trace steps for a run."""
    # Verify run exists
    run_query = select(Run.id).where(Run.id == run_id)
    run_result = await db.execute(run_query)
    if not run_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Run not found")

    query = (
        select(TraceStep)
        .where(TraceStep.run_id == run_id)
        .order_by(TraceStep.step_number)
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    return list(result.scalars().all())


@router.delete("/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_run(run_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> None:
    """Delete a run and all associated data."""
    query = select(Run).where(Run.id == run_id)
    result = await db.execute(query)
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    await db.delete(run)
