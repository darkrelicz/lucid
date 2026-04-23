"""Pydantic schemas for API request/response validation."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.trace import RunStatus, StepType
from app.models.hallucination import ClaimType, HallucinationType, Severity, VerificationMethod


# ── Run Schemas ──────────────────────────────────────────────────────────────

class RunCreate(BaseModel):
    """Request body for creating a new agent run."""

    goal: str = Field(..., min_length=1, max_length=5000, description="The high-level goal for the agent")
    model: str = Field(default="gpt-4o", description="LLM model to use")
    config: dict = Field(default_factory=dict, description="Agent configuration overrides")


class RunSummary(BaseModel):
    """Compact run info for list views."""

    id: uuid.UUID
    goal: str
    model: str
    status: RunStatus
    total_steps: int
    total_tokens: int
    total_cost: float
    confidence_score: float | None
    hallucination_count: int
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class TraceStepResponse(BaseModel):
    """Full trace step detail."""

    id: uuid.UUID
    run_id: uuid.UUID
    step_number: int
    step_type: StepType
    input_text: str
    output_text: str
    summary: str
    model: str
    prompt_messages: list[dict]
    response_raw: str
    tokens_prompt: int
    tokens_completion: int
    cost: float
    latency_ms: int
    tool_calls: list[dict]
    agent_state: dict
    confidence_score: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


class RunDetail(RunSummary):
    """Full run detail including trace steps."""

    steps: list[TraceStepResponse] = []
    error_message: str | None = None


# ── Hallucination Schemas ────────────────────────────────────────────────────

class VerificationResultResponse(BaseModel):
    """Verification check result."""

    id: uuid.UUID
    method: VerificationMethod
    verdict: str
    confidence: float
    evidence: dict
    explanation: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ClaimResponse(BaseModel):
    """Extracted claim with verification results."""

    id: uuid.UUID
    run_id: uuid.UUID
    step_id: uuid.UUID
    text: str
    claim_type: ClaimType
    source_span: str
    hallucination_type: HallucinationType
    severity: Severity
    confidence_score: float
    explanation: str
    verifications: list[VerificationResultResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class HallucinationSummary(BaseModel):
    """Summary of hallucination findings for a run."""

    run_id: uuid.UUID
    total_claims: int
    hallucinated_claims: int
    hallucination_rate: float
    by_type: dict[str, int]
    by_severity: dict[str, int]
    overall_confidence: float
    claims: list[ClaimResponse]


# ── Health Check ─────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    """Health check response."""

    status: str = "ok"
    version: str
    services: dict[str, str]
