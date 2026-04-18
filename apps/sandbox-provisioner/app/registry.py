"""Process-local registry mapping `sandbox_id` -> live container + branch.

Single-replica by design: the provisioner is meant to be deployed as a single
worker per host so it can own its docker socket. If we ever need multi-replica
HA, we'd back this with Postgres.
"""

from __future__ import annotations

from dataclasses import dataclass
from threading import Lock


@dataclass
class SandboxRecord:
    sandbox_id: str
    interview_id: str
    container_id: str
    container_name: str
    database_url: str
    neon_branch_id: str | None


class Registry:
    def __init__(self) -> None:
        self._lock = Lock()
        self._items: dict[str, SandboxRecord] = {}

    def add(self, rec: SandboxRecord) -> None:
        with self._lock:
            self._items[rec.sandbox_id] = rec

    def get(self, sandbox_id: str) -> SandboxRecord | None:
        with self._lock:
            return self._items.get(sandbox_id)

    def pop(self, sandbox_id: str) -> SandboxRecord | None:
        with self._lock:
            return self._items.pop(sandbox_id, None)

    def all(self) -> list[SandboxRecord]:
        with self._lock:
            return list(self._items.values())


registry = Registry()
