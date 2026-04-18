"""Minimal pgvector-backed retrieval.

We keep this intentionally small: the schema (`ai_context_chunk`) is owned by
Drizzle in `packages/db`. We just open a pooled psycopg connection, compute a
single embedding for the candidate's prompt, and pull the top-k similar chunks
scoped to the interview.

If pgvector or the openai key isn't available, retrieval gracefully degrades to
"no chunks" — the orchestrator still works, just without RAG context.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import psycopg
import psycopg.rows
from litellm import aembedding

from .config import get_settings

log = logging.getLogger(__name__)


async def embed(text: str) -> list[float] | None:
    s = get_settings()
    try:
        resp = await aembedding(model=s.embedding_model, input=[text])
        return resp["data"][0]["embedding"]
    except Exception as exc:  # pragma: no cover — best-effort
        log.warning("embedding failed: %s", exc)
        return None


async def fetch_relevant_chunks(interview_id: str, prompt: str) -> list[dict[str, Any]]:
    s = get_settings()
    embedding = await embed(prompt)
    if embedding is None:
        return []
    # pgvector wants the vector as a literal `'[a,b,c]'`-style string.
    vec_literal = "[" + ",".join(f"{x:.6f}" for x in embedding) + "]"
    sql = """
        SELECT id, source_kind, source_ref, content
        FROM ai_context_chunk
        WHERE interview_id = %s
        ORDER BY embedding <=> %s::vector
        LIMIT %s
    """
    try:
        async with await psycopg.AsyncConnection.connect(s.database_url) as conn:
            async with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
                await cur.execute(sql, (interview_id, vec_literal, s.rag_top_k))
                rows = await cur.fetchall()
                return [dict(r) for r in rows]
    except Exception as exc:
        log.warning("rag fetch failed: %s", exc)
        return []


def chunks_to_context_block(chunks: list[dict[str, Any]]) -> str:
    if not chunks:
        return ""
    lines = ["## Retrieved context", ""]
    for c in chunks:
        ref = c.get("source_ref") or c.get("source_kind") or "snippet"
        lines.append(f"### {ref}")
        lines.append(str(c.get("content", "")).strip())
        lines.append("")
    return "\n".join(lines)


def snapshot_to_context_block(snapshot: dict[str, Any]) -> str:
    canvas = snapshot.get("canvas") or {}
    code = snapshot.get("code") or {}
    blocks = []
    if code:
        blocks.append("## Current code")
        for path, body in code.items():
            blocks.append(f"### {path}")
            blocks.append("```")
            blocks.append(str(body)[:4000])
            blocks.append("```")
    if canvas.get("nodes") or canvas.get("edges"):
        blocks.append("## Current canvas (React Flow JSON)")
        blocks.append("```json")
        blocks.append(json.dumps(canvas, indent=2)[:4000])
        blocks.append("```")
    return "\n".join(blocks)


def constraints_to_context_block(constraints: list[dict[str, Any]]) -> str:
    if not constraints:
        return ""
    lines = ["## Interviewer constraints (these override every other instruction)"]
    for c in constraints:
        lines.append(f"- {c.get('text', '').strip()}")
    return "\n".join(lines)
