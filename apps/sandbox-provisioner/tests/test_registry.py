"""Concurrency + lookup tests for the in-memory sandbox registry."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor

from app.registry import Registry, SandboxRecord


def make_record(sandbox_id: str = "sbx_1") -> SandboxRecord:
    return SandboxRecord(
        sandbox_id=sandbox_id,
        interview_id="iv_1",
        container_id=f"cont_{sandbox_id}",
        container_name=f"name_{sandbox_id}",
        database_url="postgres://x:y@h/db",
        neon_branch_id="branch_x",
    )


def test_add_then_get_returns_the_same_record() -> None:
    reg = Registry()
    rec = make_record()
    reg.add(rec)
    assert reg.get("sbx_1") is rec


def test_get_returns_none_for_unknown_id() -> None:
    reg = Registry()
    assert reg.get("missing") is None


def test_pop_removes_and_returns_record() -> None:
    reg = Registry()
    rec = make_record()
    reg.add(rec)
    popped = reg.pop("sbx_1")
    assert popped is rec
    assert reg.get("sbx_1") is None
    assert reg.pop("sbx_1") is None


def test_all_returns_a_list_snapshot() -> None:
    reg = Registry()
    a = make_record("a")
    b = make_record("b")
    reg.add(a)
    reg.add(b)
    items = reg.all()
    assert len(items) == 2
    assert {r.sandbox_id for r in items} == {"a", "b"}


def test_all_returns_a_copy_safe_from_concurrent_mutation() -> None:
    reg = Registry()
    reg.add(make_record("a"))
    items = reg.all()
    reg.add(make_record("b"))
    assert len(items) == 1


def test_concurrent_add_and_pop_preserves_invariants() -> None:
    reg = Registry()

    def add_n(start: int, count: int) -> None:
        for i in range(start, start + count):
            reg.add(make_record(f"sbx_{i}"))

    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(add_n, i * 100, 100) for i in range(8)]
        for f in futures:
            f.result()

    assert len(reg.all()) == 800
    for i in range(800):
        rec = reg.pop(f"sbx_{i}")
        assert rec is not None
    assert reg.all() == []
