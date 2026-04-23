"""API routes for hallucination detection results."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.hallucination import Claim, HallucinationType, Severity
from app.models.trace import Run
from app.schemas import ClaimResponse, HallucinationSummary

router = APIRouter(prefix="/api/runs/{run_id}", tags=["hallucinations"])


@router.post("/analyze", status_code=202)
async def trigger_analysis(
    run_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> dict:
    """Trigger hallucination analysis on a completed run. Runs asynchronously via Celery."""
    query = select(Run).where(Run.id == run_id)
    result = await db.execute(query)
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    # TODO: Phase 3 — dispatch Celery task for analysis
    # from app.worker.tasks import analyze_run_hallucinations
    # task = analyze_run_hallucinations.delay(str(run_id))

    return {"status": "analysis_queued", "run_id": str(run_id)}


@router.get("/hallucinations", response_model=HallucinationSummary)
async def get_hallucinations(
    run_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> HallucinationSummary:
    """Get all hallucination findings for a run."""
    # Verify run exists
    run_query = select(Run).where(Run.id == run_id)
    run_result = await db.execute(run_query)
    if not run_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Run not found")

    # Fetch claims with verifications
    claims_query = (
        select(Claim)
        .options(selectinload(Claim.verifications))
        .where(Claim.run_id == run_id)
        .order_by(Claim.created_at)
    )
    claims_result = await db.execute(claims_query)
    claims = list(claims_result.scalars().all())

    total_claims = len(claims)
    hallucinated = [c for c in claims if c.hallucination_type != HallucinationType.NONE]

    # Count by type
    by_type: dict[str, int] = {}
    for c in hallucinated:
        key = c.hallucination_type.value
        by_type[key] = by_type.get(key, 0) + 1

    # Count by severity
    by_severity: dict[str, int] = {}
    for c in hallucinated:
        key = c.severity.value
        by_severity[key] = by_severity.get(key, 0) + 1

    # Overall confidence
    avg_confidence = (
        sum(c.confidence_score for c in claims) / total_claims if total_claims > 0 else 1.0
    )

    return HallucinationSummary(
        run_id=run_id,
        total_claims=total_claims,
        hallucinated_claims=len(hallucinated),
        hallucination_rate=len(hallucinated) / total_claims if total_claims > 0 else 0.0,
        by_type=by_type,
        by_severity=by_severity,
        overall_confidence=avg_confidence,
        claims=[ClaimResponse.model_validate(c) for c in claims],
    )


@router.get("/claims", response_model=list[ClaimResponse])
async def get_claims(
    run_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> list[Claim]:
    """Get all extracted claims with verification verdicts for a run."""
    query = (
        select(Claim)
        .options(selectinload(Claim.verifications))
        .where(Claim.run_id == run_id)
        .order_by(Claim.created_at)
    )
    result = await db.execute(query)
    return list(result.scalars().all())
