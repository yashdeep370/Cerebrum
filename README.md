# Cerebrum

AI-powered document intelligence platform. Upload a document and get an
instant summary, chat with it (answers are grounded in and cite the source
text), ask questions across your *entire* document library at once, run
autonomous web research with cited sources, and generate polished reports —
exportable as PDF. Built to run entirely on free-tier infrastructure.

**Live demo:** https://cerebrum-gilt.vercel.app

## Features

- **Document upload** — PDF, TXT, or MD, drag-and-drop
- **Automatic summarization** on upload
- **Chat with a document** — RAG-based Q&A with citations back to source excerpts
- **Multi-turn chat memory** — follow-up questions understand prior context
- **Library-wide chat** — ask questions across all your documents at once
- **Autonomous research agent** — live web search, synthesized into one cited answer
- **Report generation** — combines summary + chat history + fresh research into a markdown report
- **PDF export** for generated reports
- **Password-gated access** and **rate limiting** so it's safe to run on free API tiers

See [`TECH_STACK_AND_FEATURES.txt`](./TECH_STACK_AND_FEATURES.txt) for a full
description of every feature and every library used, and why.

## Project structure

```
Cerebrum/
├── backend/     FastAPI + SQLAlchemy backend (RAG chat, research agent, reports)
├── frontend/    Next.js + TypeScript + Tailwind frontend
└── render.yaml  Render deployment blueprint for the backend
```

## Tech stack

**Backend:** Python 3.12, FastAPI, SQLAlchemy, SQLite (dev) / PostgreSQL (prod),
Groq + Anthropic (swappable LLM providers), Tavily (web search), slowapi (rate
limiting).

**Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, react-markdown.

**Hosting:** Render (backend), Vercel (frontend), Neon (Postgres) — all free tiers.

## Getting started locally

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env         # then fill in your API keys
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
npm run dev
```

Then open http://localhost:3000.

### Getting free API keys

- **Groq** (LLM inference): [console.groq.com](https://console.groq.com) — free tier, no card
- **Tavily** (web search): [tavily.com](https://tavily.com) — free tier, no card
- **Neon** (Postgres, for production): [neon.tech](https://neon.tech) — free tier, no card

## Environment variables

**Backend** (`backend/.env`, see `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `LLM_PROVIDER` | `groq` (dev) or `anthropic` (prod) |
| `GROQ_API_KEY` / `GROQ_MODEL` | Groq credentials + model |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Anthropic credentials + model |
| `TAVILY_API_KEY` | Web search for the research agent |
| `DATABASE_URL` | SQLite path locally, Postgres URL in production |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins |
| `APP_PASSWORD` | Shared password gating the whole API (empty disables it) |

**Frontend** (`frontend/.env.local`):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the backend API |

## Deployment

Deployed on Render (backend, via the included `render.yaml` blueprint), Vercel
(frontend), and Neon (Postgres) — all free tiers. See `render.yaml` for the
exact backend build/start configuration.
