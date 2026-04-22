# Leucent

A synchronous, multi-tenant interview platform: a candidate IDE/canvas, a
real-time console for interviewers, an AI co-pilot, and an isolated
code execution sandbox.

See [`AGENTS.md`](./AGENTS.md) for the architecture overview and developer quickstart.

## Quickstart

Copy [`.env.example`](./.env.example) to `.env` and set a **Neon dev branch**
`DATABASE_URL` (pooled) plus Neon Auth and service secrets. Then:

```bash
pnpm install
pnpm compose:up
pnpm --filter @leucent/db migrate
pnpm dev
```

`pnpm compose:up` starts **MinIO and Docker-in-Docker** for replay/sandboxes only.
Postgres is expected to come from **Neon**, not a local Docker image.

Open [http://localhost:3000]. See [AGENTS.md](./AGENTS.md) for the full
architecture and optional `compose:up:local-pg` (legacy Docker Postgres).

## Repository layout

```{shell}
apps/
  web/                    Next.js 15 (App Router) — candidate IDE + interviewer console + auth
  realtime-server/        Rust + Axum + yrs — Yjs sync + telemetry channel
  ai-orchestrator/        Python + FastAPI + LiteLLM — AI co-pilot SSE
  sandbox-provisioner/    Python + FastAPI + Docker — ephemeral exec environments
packages/
  shared-protocol/        TS event types + JSON Schema (consumed by web/Rust/Python)
  db/                     Drizzle schema + migrations for Neon Postgres
  ui/                     Shared React components + Tailwind preset
infra/
  docker-compose.yml        Local dev: MinIO, Docker-in-Docker; optional Docker Postgres (profile)
```

## License

Proprietary — Leucent.
