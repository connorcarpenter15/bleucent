# @leucent/ai-orchestrator

FastAPI + LiteLLM service that:

- exposes `POST /ai/stream` returning Server-Sent Events
- pulls live snapshot (canvas + code) from the realtime server
- pulls active interviewer constraints from the Next.js app
- pulls relevant chunks from `ai_context_chunk` (pgvector RAG)
- mirrors every streamed chunk to the realtime telemetry channel via
  `POST /internal/broadcast/{id}`

## Local dev

From the repo root:

```bash
pnpm --filter @leucent/ai-orchestrator dev
```

The `predev` hook (`scripts/bootstrap-python-venv.sh`) creates
`apps/ai-orchestrator/.venv` on first run and installs this package with its
`[dev]` extras, so the dev server picks up project-local deps instead of
whatever `uvicorn` happens to be on your system `$PATH` (homebrew, anaconda,
pyenv, ...). Subsequent runs skip the bootstrap and start immediately. If you
rename or move the repo directory, the bootstrap detects the resulting stale
shebangs and rebuilds the venv.

If you prefer the manual flow:

```bash
cd apps/ai-orchestrator
python3.11 -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'
python -m uvicorn app.main:app --reload --port 5050
```

The service expects the standard root `.env` to be loaded (see `.env.example`).

> Why port 5050 and not 5000? macOS's AirPlay Receiver binds `*:5000` by
> default (System Settings → General → AirDrop & Handoff). Picking 5050
> avoids the collision without requiring every contributor to disable an
> OS setting. Railway still exposes the service on whatever `$PORT` it
> chooses in production.
