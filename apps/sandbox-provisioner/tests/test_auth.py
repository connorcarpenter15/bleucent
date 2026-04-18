"""Internal-only auth dependency: every privileged route requires the shared token."""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.auth import require_internal
from app.config import get_settings


@pytest.mark.asyncio
async def test_require_internal_accepts_correct_bearer_token() -> None:
    s = get_settings()
    await require_internal(authorization=f"Bearer {s.realtime_internal_token}")


@pytest.mark.asyncio
async def test_require_internal_rejects_missing_header() -> None:
    with pytest.raises(HTTPException) as excinfo:
        await require_internal(authorization=None)
    assert excinfo.value.status_code == 401


@pytest.mark.asyncio
async def test_require_internal_rejects_wrong_scheme_or_secret() -> None:
    s = get_settings()
    with pytest.raises(HTTPException) as excinfo:
        await require_internal(authorization=f"Basic {s.realtime_internal_token}")
    assert excinfo.value.status_code == 401
    with pytest.raises(HTTPException):
        await require_internal(authorization="Bearer wrong-token")
