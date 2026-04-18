"""Unit tests for the LLM prompt assembler.

The orchestrator's contract is that interviewer constraints are *always last*
in the system prompt, so they cannot be drowned out by retrieved context.
We assert that ordering explicitly here.
"""

from __future__ import annotations

from app.prompt import BASE_SYSTEM_PROMPT, build_messages


def test_build_messages_returns_system_and_user_pair() -> None:
    msgs = build_messages(
        snapshot={}, constraints=[], chunks=[], sandbox_files=[], prompt="hi"
    )
    assert [m["role"] for m in msgs] == ["system", "user"]
    assert msgs[1]["content"] == "hi"


def test_base_persona_is_always_first() -> None:
    msgs = build_messages(
        snapshot={}, constraints=[], chunks=[], sandbox_files=[], prompt="ping"
    )
    system = msgs[0]["content"]
    assert system.startswith(BASE_SYSTEM_PROMPT.strip().splitlines()[0])


def test_constraints_are_appended_last() -> None:
    msgs = build_messages(
        snapshot={"code": {"a.py": "print('a')"}},
        constraints=[{"text": "no recursion"}, {"text": "no global state"}],
        chunks=[{"source_ref": "snippet-1", "content": "snippet body"}],
        sandbox_files=[{"path": "a.py", "size": 12}],
        prompt="give me a hint",
    )
    system = msgs[0]["content"]
    constraints_idx = system.find("Interviewer constraints")
    assert constraints_idx > 0
    assert system.find("Retrieved context") < constraints_idx
    assert system.find("Sandbox file tree") < constraints_idx
    assert system.find("Current code") < constraints_idx
    for needle in ("no recursion", "no global state"):
        assert needle in system


def test_sandbox_files_block_is_truncated_to_50_entries() -> None:
    files = [{"path": f"f{i}.py", "size": i} for i in range(120)]
    msgs = build_messages(
        snapshot={}, constraints=[], chunks=[], sandbox_files=files, prompt="x"
    )
    system = msgs[0]["content"]
    assert "f0.py" in system
    assert "f49.py" in system
    assert "f50.py" not in system


def test_no_optional_sections_when_inputs_are_empty() -> None:
    msgs = build_messages(
        snapshot={}, constraints=[], chunks=[], sandbox_files=[], prompt="x"
    )
    system = msgs[0]["content"]
    for section in (
        "Sandbox file tree",
        "Retrieved context",
        "Interviewer constraints",
        "Current code",
        "Current canvas",
    ):
        assert section not in system


def test_user_message_is_the_raw_prompt() -> None:
    msgs = build_messages(
        snapshot={"canvas": {"nodes": [{"id": "n"}], "edges": []}},
        constraints=[],
        chunks=[],
        sandbox_files=[],
        prompt="EXACT_PROMPT",
    )
    assert msgs[1] == {"role": "user", "content": "EXACT_PROMPT"}
