"""Thin async HTTP clients for the realtime server, web app, and sandbox.

Each function isolates one external dependency so the route handlers stay
focused on prompt assembly + streaming.
"""

from __future__ import annotations

from typing import Any

import httpx

from .config import get_settings

_TIMEOUT = httpx.Timeout(connect=5.0, read=15.0, write=15.0, pool=5.0)


async def fetch_snapshot(interview_id: str) -> dict[str, Any]:
    """`GET /internal/snapshot/{id}` on the Rust realtime server.

    Returns `{"canvas": {...}, "code": {...}}`. If the room isn't live yet we
    return an empty snapshot rather than failing — the candidate may be asking
    a meta-question before they've touched the editor.
    """
    s = get_settings()
    url = f"{s.realtime_server_url}/internal/snapshot/{interview_id}"
    headers = {"authorization": f"Bearer {s.realtime_internal_token}"}
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        try:
            r = await client.get(url, headers=headers)
            if r.status_code == 404:
                return {"canvas": {"nodes": [], "edges": []}, "code": {}}
            r.raise_for_status()
            return r.json()
        except httpx.HTTPError:
            return {"canvas": {"nodes": [], "edges": []}, "code": {}}


async def fetch_constraints(interview_id: str) -> list[dict[str, Any]]:
    """Pull active interviewer constraints from the Next.js app."""
    s = get_settings()
    url = f"{s.web_app_url}/api/interviews/{interview_id}/constraints"
    headers = {"authorization": f"Bearer {s.realtime_internal_token}"}
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        try:
            r = await client.get(url, headers=headers)
            r.raise_for_status()
            return r.json().get("constraints", [])
        except httpx.HTTPError:
            return []


async def list_sandbox_files(sandbox_id: str | None) -> list[dict[str, Any]]:
    """Best-effort directory listing from the sandbox provisioner."""
    if not sandbox_id:
        return []
    s = get_settings()
    url = f"{s.sandbox_provisioner_url}/sandboxes/{sandbox_id}/fs"
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        try:
            r = await client.get(url)
            r.raise_for_status()
            return r.json().get("entries", [])
        except httpx.HTTPError:
            return []


async def broadcast_chunk(
    interview_id: str,
    *,
    kind: str,
    actor: str,
    payload: dict[str, Any],
) -> None:
    """Mirror an event to the realtime telemetry channel.

    Used to push `ai_response_chunk` and `ai_prompt` events so the interviewer console sees
    the AI conversation as it happens. Failures are swallowed; mirroring is
    best-effort and must never block the candidate-facing stream.
    """
    s = get_settings()
    url = f"{s.realtime_server_url}/internal/broadcast/{interview_id}"
    headers = {"authorization": f"Bearer {s.realtime_internal_token}"}
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        try:
            await client.post(url, headers=headers, json={
                "kind": kind,
                "actor": actor,
                "payload": payload,
            })
        except httpx.HTTPError:
            pass
