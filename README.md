# Lucid ◈

**Hallucination Auditor for Self-Orchestrating AI Agents**

> *Lucid (adj.) — thinking or expressing oneself clearly; not hallucinating.*

Lucid is an AI security research tool that provides an **auditable, inspectable, and tunable** pipeline for detecting, classifying, and reducing hallucinations in self-orchestrating agentic AI systems.

## Features

- 🔍 **Full Trace Logging** — Every LLM call, tool invocation, and reasoning step captured with full provenance
- 🎯 **Hallucination Detection** — Automatic claim extraction, fact verification, and classification into 6 hallucination types
- 📊 **Audit Dashboard** — Visual timeline, provenance graph, and hallucination cards with confidence scoring
- 🔧 **Tuning Controls** — Adjust prompts, guardrails, retrieval, and model parameters; measure the impact
- ⚑ **Red-Teaming** — Automated adversarial testing to find your agent's weakest points
- 🤖 **Multi-LLM** — Works with OpenAI, Anthropic, Ollama, and any OpenAI-compatible API

## Quick Start

```bash
# Clone and configure
git clone https://github.com/your-username/lucid.git
cd lucid
cp .env.example .env
# Edit .env with your API keys

# Launch all services
docker compose up

# Access
# Dashboard: http://localhost:5173
# API Docs:  http://localhost:8000/docs
# Health:    http://localhost:8000/health
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy (async) |
| Frontend | React, TypeScript, Vite |
| Database | PostgreSQL 16 |
| Vector Store | ChromaDB |
| LLM Layer | LiteLLM (multi-provider) |
| Task Queue | Celery + Redis |
| Deployment | Docker Compose |

## Architecture

The system follows a modular pipeline:

1. **Agent Core** — Custom self-orchestrating agent (Plan → Execute → Observe → Reflect → Correct)
2. **Trace Logger** — Captures every decision with full prompt/response data
3. **Detection Pipeline** — Extracts claims, verifies against sources, classifies hallucinations
4. **Audit Dashboard** — Visual inspection and drill-down into every step
5. **Tuning Engine** — Versioned configuration changes with impact measurement
6. **Red Team Engine** — Adversarial prompt generation and vulnerability analysis

## License

MIT
