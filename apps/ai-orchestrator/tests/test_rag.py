"""Unit tests for RAG context-block formatters.

The DB-touching paths (`embed`, `fetch_relevant_chunks`) are integration-only
because they require a live psycopg connection + LiteLLM API key. The pure
formatter functions are exhaustively covered here.
"""

from __future__ import annotations

from app.rag import (
    chunks_to_context_block,
    constraints_to_context_block,
    snapshot_to_context_block,
)


def test_chunks_block_returns_empty_string_when_no_chunks() -> None:
    assert chunks_to_context_block([]) == ""


def test_chunks_block_renders_a_section_per_chunk() -> None:
    block = chunks_to_context_block(
        [
            {"source_ref": "auth.py:42", "content": "def login(): ..."},
            {"source_ref": None, "source_kind": "snippet", "content": "x = 1"},
            {"content": "y = 2"},
        ]
    )
    assert block.startswith("## Retrieved context")
    assert "### auth.py:42" in block
    assert "def login(): ..." in block
    assert "### snippet" in block
    assert "x = 1" in block
    assert "### snippet" in block
    assert "y = 2" in block


def test_constraints_block_is_empty_when_none_supplied() -> None:
    assert constraints_to_context_block([]) == ""


def test_constraints_block_strips_each_text_and_marks_as_overrides() -> None:
    block = constraints_to_context_block(
        [{"text": "  no recursion "}, {"text": "no while loops"}]
    )
    lines = block.splitlines()
    assert "Interviewer constraints" in lines[0]
    assert "override" in lines[0]
    assert lines[1] == "- no recursion"
    assert lines[2] == "- no while loops"


def test_constraint_with_missing_text_is_rendered_as_empty_bullet() -> None:
    block = constraints_to_context_block([{}])
    assert block.splitlines()[1] == "- "


def test_snapshot_block_renders_code_files_with_fenced_blocks() -> None:
    block = snapshot_to_context_block(
        {"code": {"src/a.py": "print('a')", "src/b.py": "print('b')"}}
    )
    assert "## Current code" in block
    assert "### src/a.py" in block
    assert "### src/b.py" in block
    assert "```" in block


def test_snapshot_block_truncates_long_file_bodies_to_4000_chars() -> None:
    huge = "x" * 10_000
    block = snapshot_to_context_block({"code": {"big.py": huge}})
    body_lines = [ln for ln in block.splitlines() if "x" in ln]
    assert body_lines, "the truncated body should appear somewhere"
    longest = max(len(ln) for ln in body_lines)
    assert longest <= 4000


def test_snapshot_block_renders_canvas_only_when_nodes_or_edges_present() -> None:
    empty = snapshot_to_context_block({"canvas": {"nodes": [], "edges": []}})
    assert "Current canvas" not in empty
    full = snapshot_to_context_block(
        {"canvas": {"nodes": [{"id": "n", "type": "service", "data": {}}], "edges": []}}
    )
    assert "## Current canvas" in full


def test_snapshot_block_handles_completely_empty_input() -> None:
    assert snapshot_to_context_block({}) == ""
