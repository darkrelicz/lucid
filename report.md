# Lucid — Development Report

> **Project**: Lucid — Hallucination Auditor for Self-Orchestrating AI Agents  
> **Started**: 2026-04-24  
> **Status**: Phase 1 — In Progress

---

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Architecture Decisions](#architecture-decisions)
- [Phase 1: Project Scaffolding & Infrastructure](#phase-1-project-scaffolding--infrastructure)

---

## Design Philosophy

### Why "Lucid"?

The name **Lucid** (adj. — *thinking clearly; not hallucinating*) was chosen for its semantic precision and brandability. The project exists at the intersection of AI safety research and developer tooling — it needs to be taken seriously while remaining memorable for portfolio purposes.

### Core Design Principles

1. **Auditability first**: Every decision an AI agent makes must be traceable back to its source — the prompt, the model, the tool output, and the reasoning chain. No black boxes.

2. **Detection + Provenance**: It's not enough to flag a hallucination. Lucid traces *where* in the workflow the hallucination originated, *what* information fed into it, and *why* the agent made that choice.

3. **Tunable, not just observable**: Users can't just watch — they can adjust prompts, guardrails, retrieval parameters, and model settings, then measure the impact on hallucination rates.

4. **Offensive + Defensive**: The system both detects hallucinations (defensive) and proactively generates adversarial prompts to find weaknesses (offensive/red-teaming).

5. **Multi-LLM by default**: Not locked to a single provider. Uses LiteLLM as an abstraction layer so the same audit workflow works across OpenAI, Anthropic, Ollama, and any OpenAI-compatible endpoint.

---

## Architecture Decisions

### ADR-001: Custom Agent Loop vs. Framework Integration

**Decision**: Build a custom self-orchestrating agent instead of wrapping LangChain/LangGraph.

**Rationale**:
- Full control over the trace logging — every LLM call, tool invocation, and state transition is captured at the granularity we need
- LangChain's abstractions would hide the exact data we need to audit
- Better portfolio storytelling — demonstrates deeper understanding of agent architecture
- Avoids framework version churn as a dependency risk

**Trade-off**: More initial code to write, but the agent core is purposefully simple (Plan → Execute → Observe → Reflect → Correct). The complexity lives in the detection pipeline, not the agent itself.

### ADR-002: LiteLLM for Multi-Provider LLM Access

**Decision**: Use [LiteLLM](https://github.com/BerriAI/litellm) as the LLM abstraction layer.

**Rationale**:
- Unified `completion()` API across 100+ providers
- Built-in token counting, cost tracking, and retry logic
- Supports streaming, function calling, and structured output
- Avoids maintaining separate SDK integrations for OpenAI, Anthropic, Ollama, etc.

### ADR-003: PostgreSQL + SQLAlchemy Async for Trace Storage

**Decision**: Use PostgreSQL with async SQLAlchemy for all structured audit data.

**Rationale**:
- Trace data is inherently relational (runs → steps → claims → verifications)
- JSONB columns for flexible schema parts (prompt messages, tool call args, agent state snapshots)
- PostgreSQL's reliability and query power suit audit/compliance use cases
- Async SQLAlchemy avoids blocking the FastAPI event loop during DB operations

### ADR-004: Celery + Redis for Async Task Execution

**Decision**: Use Celery with Redis as broker for long-running agent execution and hallucination analysis.

**Rationale**:
- Agent runs can take minutes (multiple LLM calls, tool executions)
- Hallucination analysis involves multiple verification passes per claim
- Celery provides task retry, progress tracking, and worker scaling
- Redis serves dual purpose: Celery broker and result backend

### ADR-005: ChromaDB for Grounding Verification

**Decision**: Use ChromaDB as the vector store for grounding checks.

**Rationale**:
- Lightweight and embeddable — no external service required for simple setups
- Sufficient for the grounding check use case (embed source docs, cosine similarity against claims)
- Docker-friendly with official image
- Can be swapped for Pinecone/Weaviate later without changing the detection interface

### ADR-006: Vite + React + TypeScript for Frontend

**Decision**: Use Vite with React and TypeScript for the audit dashboard.

**Rationale**:
- Vite provides fast HMR for iterative UI development
- React ecosystem has the best libraries for our visualization needs (@xyflow/react for DAGs, recharts for metrics)
- TypeScript catches schema mismatches between frontend and API early
- Framer Motion for polished micro-animations

### ADR-007: Dark Theme with Semantic Color Coding

**Decision**: Dashboard uses a dark theme with green/amber/red confidence indicators.

**Rationale**:
- Dark theme is standard for developer/security tools (feels professional)
- Traffic-light color coding (green = grounded, amber = uncertain, red = hallucinated) provides instant visual scanning
- Glassmorphism cards add visual depth without clutter
- Consistent with the "security audit" aesthetic

---

## Phase 1: Project Scaffolding & Infrastructure

**Goal**: Set up a production-grade project skeleton with CI, Docker, and all infrastructure services running locally.

**Status**: 🔄 In Progress

### Monorepo Structure

Created a monorepo layout separating backend, frontend, and infrastructure:

```
lucid/
├── docker-compose.yml          # All services orchestration
├── Dockerfile.api              # Python backend container
├── Dockerfile.frontend         # Node frontend container
├── .env.example                # Configuration reference
├── report.md                   # This file
├── backend/                    # Python FastAPI backend
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   ├── app/
│   │   ├── main.py             # FastAPI app entrypoint
│   │   ├── config.py           # Pydantic settings
│   │   ├── database.py         # SQLAlchemy async setup
│   │   ├── schemas.py          # Pydantic request/response schemas
│   │   ├── api/
│   │   │   ├── runs.py         # CRUD routes for agent runs
│   │   │   └── hallucinations.py  # Detection results routes
│   │   ├── models/
│   │   │   ├── trace.py        # Run, TraceStep ORM models
│   │   │   └── hallucination.py   # Claim, VerificationResult models
│   │   └── worker/
│   │       ├── celery_app.py   # Celery configuration
│   │       └── tasks.py        # Task stubs (Phase 2/3)
│   └── tests/
│       └── test_api.py         # API endpoint tests
└── frontend/                   # Vite + React + TypeScript
    ├── package.json
    └── src/                    # (scaffolded by create-vite)
```

### Backend Design Decisions

#### Configuration (`app/config.py`)

Used **Pydantic Settings** for type-safe environment variable loading:
- All config has sensible defaults for local development
- Docker Compose overrides point services to container hostnames
- Celery broker/backend URLs default to the Redis URL if not explicitly set
- CORS origins include both Vite (5173) and alternative (3000) dev server ports

#### Database Models (`app/models/`)

Two model groups, designed for the full audit trail:

**Trace models** (`trace.py`):
- `Run` — top-level entity representing one agent execution. Stores goal, model, status, aggregate metrics (steps, tokens, cost, confidence, hallucination count), and timestamps.
- `TraceStep` — individual step in the agent loop. Stores the full LLM prompt/response, tool calls as JSONB, token counts, latency, cost, and an agent state snapshot.
- Used PostgreSQL `JSONB` for flexible nested data (prompt messages, tool call arguments) while keeping structured fields (step type, timestamps) as proper columns for queryability.

**Hallucination models** (`hallucination.py`):
- `Claim` — an atomic claim extracted from agent output, tagged with type and linked to its source step.
- `VerificationResult` — result of one verification method (grounding, citation, cross-reference, self-consistency) applied to a claim.
- Enums for all classification categories: 6 hallucination types × 4 severity levels × 4 verification methods.

#### API Routes (`app/api/`)

RESTful endpoints following standard patterns:
- `POST /api/runs` — create a run (will dispatch Celery task in Phase 2)
- `GET /api/runs` — list runs with model/status filtering
- `GET /api/runs/{id}` — full run detail with eager-loaded steps
- `GET /api/runs/{id}/steps` — paginated trace steps
- `DELETE /api/runs/{id}` — cascade delete run + all associated data
- `POST /api/runs/{id}/analyze` — trigger hallucination analysis (Phase 3)
- `GET /api/runs/{id}/hallucinations` — aggregated hallucination summary
- `GET /api/runs/{id}/claims` — raw claims with verification results

#### Celery Worker (`app/worker/`)

- Configured with JSON serialization, UTC timezone, late acks (tasks only acknowledged after completion, preventing data loss on worker crash)
- Two task stubs ready for Phase 2 (agent execution) and Phase 3 (hallucination analysis)

### Infrastructure

#### Docker Compose (`docker-compose.yml`)

Six services orchestrated together:

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| `api` | Custom (Dockerfile.api) | 8000 | FastAPI backend with hot reload |
| `worker` | Custom (Dockerfile.api) | — | Celery worker for async tasks |
| `frontend` | Custom (Dockerfile.frontend) | 5173 | Vite dev server with HMR |
| `postgres` | postgres:16-alpine | 5432 | Primary database |
| `redis` | redis:7-alpine | 6379 | Celery broker + result backend |
| `chromadb` | chromadb/chroma:latest | 8100 | Vector store for grounding |

Key design choices:
- **Health checks** on postgres and redis with `service_healthy` conditions — API and worker won't start until databases are ready
- **Volume mounts** for live code reloading in development
- **Named volumes** for data persistence across container restarts
- **ChromaDB on port 8100** to avoid conflict with the API's port 8000

#### Dockerfiles

- **Dockerfile.api**: Python 3.12 slim, installs via pyproject.toml, runs uvicorn with `--reload` for development
- **Dockerfile.frontend**: Node 22 slim, copies package.json first for layer caching, runs Vite with `--host 0.0.0.0` for container accessibility

### Frontend Setup

Scaffolded with `create-vite@latest` using the `react-ts` template. Installed additional dependencies:

| Package | Version | Purpose |
|---------|---------|---------|
| `react-router-dom` | 7.14.2 | Client-side routing |
| `recharts` | 3.8.1 | Charts for metrics dashboard |
| `@xyflow/react` | 12.10.2 | Interactive DAG for provenance graph |
| `framer-motion` | 12.38.0 | Animations and transitions |

**Next**: Build the design system (CSS variables, dark theme, typography) and core page layouts.

---

*Report continues as development progresses...*
