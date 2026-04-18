"""Neon branching + readiness.

A Neon branch is a fast, copy-on-write fork of the parent branch. The control
plane is async though, so we always run a strict `SELECT 1` poll loop before
returning a connection string to the caller. See plan section 3C.

If the Neon API key isn't configured, we fall back to the shared local
Postgres URL — useful for local dev with `docker compose up`.
"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from dataclasses import dataclass

import httpx
import psycopg

from .config import get_settings

log = logging.getLogger(__name__)


@dataclass
class BranchHandle:
    branch_id: str | None
    database_url: str


async def create_branch(interview_id: str) -> BranchHandle:
    s = get_settings()
    if not (s.neon_api_key and s.neon_project_id):
        log.warning("Neon not configured; using shared local DATABASE_URL")
        return BranchHandle(branch_id=None, database_url=s.database_url)

    branch_name = f"interview-{interview_id[:8]}-{uuid.uuid4().hex[:6]}"
    url = f"https://console.neon.tech/api/v2/projects/{s.neon_project_id}/branches"
    headers = {
        "authorization": f"Bearer {s.neon_api_key}",
        "content-type": "application/json",
    }
    body = {
        "branch": {"name": branch_name, "parent_id": s.neon_parent_branch_id},
        "endpoints": [{"type": "read_write"}],
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(url, headers=headers, json=body)
        r.raise_for_status()
        data = r.json()

    branch = data["branch"]
    endpoint = (data.get("endpoints") or [{}])[0]
    host = endpoint.get("host")
    if not host:
        raise RuntimeError("Neon did not return an endpoint host")

    # Neon branches inherit the role's password; if you're using passwordless
    # auth, swap this for the project's connection string template.
    db_url = (
        f"postgresql://{s.neon_role}@{host}/{s.neon_database}?sslmode=require"
    )
    return BranchHandle(branch_id=branch["id"], database_url=db_url)


async def delete_branch(branch_id: str | None) -> None:
    if not branch_id:
        return
    s = get_settings()
    if not (s.neon_api_key and s.neon_project_id):
        return
    url = (
        f"https://console.neon.tech/api/v2/projects/"
        f"{s.neon_project_id}/branches/{branch_id}"
    )
    headers = {"authorization": f"Bearer {s.neon_api_key}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            await client.delete(url, headers=headers)
        except httpx.HTTPError as exc:
            log.warning("Neon delete failed: %s", exc)


async def wait_until_ready(database_url: str) -> None:
    """Block until the DB accepts `SELECT 1` or the budget is exhausted.

    Uses exponential backoff (250ms → 5s) within a 30s total budget. Raises if
    the budget is exhausted, so the caller never returns a half-ready sandbox.
    """
    s = get_settings()
    deadline = time.monotonic() + s.readiness_total_seconds
    delay = s.readiness_initial_delay
    last_err: Exception | None = None

    while time.monotonic() < deadline:
        try:
            async with await psycopg.AsyncConnection.connect(
                database_url, connect_timeout=5
            ) as conn:
                async with conn.cursor() as cur:
                    await cur.execute("SELECT 1")
                    await cur.fetchone()
            return
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            await asyncio.sleep(delay)
            delay = min(delay * 2, s.readiness_max_delay)

    raise RuntimeError(
        f"database did not become ready within "
        f"{s.readiness_total_seconds}s: {last_err}"
    )
