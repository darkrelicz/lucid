"""Celery tasks — stubs for Phase 2 and Phase 3."""

from app.worker.celery_app import celery_app


@celery_app.task(bind=True, name="lucid.execute_agent_run")
def execute_agent_run(self, run_id: str) -> dict:  # type: ignore[no-untyped-def]
    """Execute an agent run asynchronously. Implemented in Phase 2."""
    # TODO: Phase 2 — implement agent orchestration
    return {"status": "not_implemented", "run_id": run_id}


@celery_app.task(bind=True, name="lucid.analyze_run_hallucinations")
def analyze_run_hallucinations(self, run_id: str) -> dict:  # type: ignore[no-untyped-def]
    """Analyze a completed run for hallucinations. Implemented in Phase 3."""
    # TODO: Phase 3 — implement hallucination detection pipeline
    return {"status": "not_implemented", "run_id": run_id}
