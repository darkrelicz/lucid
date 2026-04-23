"""SQLAlchemy models for hallucination detection results."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ClaimType(str, enum.Enum):
    """Type of atomic claim extracted from agent output."""

    FACTUAL = "factual"
    NUMERICAL = "numerical"
    CITATION = "citation"
    REASONING = "reasoning"
    OPINION = "opinion"


class HallucinationType(str, enum.Enum):
    """Classification of hallucination type."""

    NONE = "none"
    INTRINSIC = "intrinsic"
    EXTRINSIC = "extrinsic"
    FABRICATED_CITATION = "fabricated_citation"
    REASONING_ERROR = "reasoning_error"
    TOOL_MISUSE = "tool_misuse"
    SELF_CONTRADICTION = "self_contradiction"


class Severity(str, enum.Enum):
    """Severity level of a hallucination finding."""

    NONE = "none"
    MINOR = "minor"
    MODERATE = "moderate"
    CRITICAL = "critical"


class VerificationMethod(str, enum.Enum):
    """Method used to verify a claim."""

    GROUNDING = "grounding"
    CITATION = "citation"
    CROSS_REFERENCE = "cross_reference"
    SELF_CONSISTENCY = "self_consistency"


class Claim(Base):
    """An atomic claim extracted from an agent's output."""

    __tablename__ = "claims"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("runs.id", ondelete="CASCADE"), nullable=False
    )
    step_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("trace_steps.id", ondelete="CASCADE"), nullable=False
    )

    # Claim content
    text: Mapped[str] = mapped_column(Text, nullable=False)
    claim_type: Mapped[ClaimType] = mapped_column(Enum(ClaimType), nullable=False)
    source_span: Mapped[str] = mapped_column(Text, default="")

    # Verdict (populated after verification)
    hallucination_type: Mapped[HallucinationType] = mapped_column(
        Enum(HallucinationType), default=HallucinationType.NONE
    )
    severity: Mapped[Severity] = mapped_column(Enum(Severity), default=Severity.NONE)
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0)
    explanation: Mapped[str] = mapped_column(Text, default="")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    verifications: Mapped[list["VerificationResult"]] = relationship(
        back_populates="claim", cascade="all, delete-orphan"
    )


class VerificationResult(Base):
    """Result of a single verification check on a claim."""

    __tablename__ = "verification_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    claim_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("claims.id", ondelete="CASCADE"), nullable=False
    )

    method: Mapped[VerificationMethod] = mapped_column(Enum(VerificationMethod), nullable=False)
    verdict: Mapped[str] = mapped_column(String(50), nullable=False)  # "pass", "fail", "uncertain"
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    evidence: Mapped[dict] = mapped_column(JSONB, default=dict)
    explanation: Mapped[str] = mapped_column(Text, default="")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    claim: Mapped["Claim"] = relationship(back_populates="verifications")
