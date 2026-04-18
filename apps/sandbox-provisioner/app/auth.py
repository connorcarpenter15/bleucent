"""Internal-only auth: every route requires the shared service token.

The provisioner is a privileged surface (it spins containers, branches the
DB, and executes arbitrary commands), so it must never be exposed publicly.
We still verify the bearer token even on the internal network as a defence
in depth.
"""

from fastapi import Header, HTTPException, status

from .config import get_settings


async def require_internal(authorization: str | None = Header(default=None)) -> None:
    s = get_settings()
    expected = f"Bearer {s.realtime_internal_token}"
    if not authorization or authorization != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="internal token required",
        )
