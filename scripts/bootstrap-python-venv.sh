#!/usr/bin/env bash
# scripts/bootstrap-python-venv.sh — idempotent Python venv bootstrapper.
#
# Used by pnpm dev scripts in apps/ai-orchestrator and apps/sandbox-provisioner
# to make `pnpm dev` "just work" on fresh clones without the contributor having
# to remember to create a venv and pip install first.
#
# Behavior:
#   - If `.venv` already has a working interpreter and uvicorn installed,
#     exits silently (fast path).
#   - Otherwise creates `.venv` fresh and installs the package with its
#     [dev] extras. A venv that was created under a different repo path
#     (stale shebangs / bad symlinks) is treated as unusable and rebuilt.
#
# Why this exists:
#   pnpm runs scripts via /bin/sh with the system $PATH. On a macOS dev
#   machine with homebrew / anaconda / pyenv Python on PATH, bare commands
#   like `uvicorn` resolve to *that* interpreter's site-packages — which
#   doesn't have the project's dependencies installed — so `pnpm dev` dies
#   with `ModuleNotFoundError: No module named 'litellm'` (or similar). By
#   routing through `./.venv/bin/python -m uvicorn` and installing into
#   that venv on first run, we make the tooling project-local.
#
# Usage:
#   sh scripts/bootstrap-python-venv.sh <service-dir>
#   # e.g. from apps/ai-orchestrator:
#   sh ../../scripts/bootstrap-python-venv.sh .

set -euo pipefail

SERVICE_DIR="${1:-.}"
cd "$SERVICE_DIR"

VENV=".venv"

# A venv is considered "usable" if its python interpreter runs AND uvicorn is
# importable. This catches both the fresh-clone case (no venv) and the
# stale-venv case (e.g. the repo directory was renamed, leaving broken
# shebangs like `#!/Users/foo/OLD_NAME/apps/.../.venv/bin/python3.11`).
if [ -x "$VENV/bin/python" ] \
    && "$VENV/bin/python" -c 'import uvicorn' >/dev/null 2>&1; then
  exit 0
fi

if [ -d "$VENV" ]; then
  echo "bootstrap-python-venv: existing $SERVICE_DIR/$VENV is unusable (stale or incomplete), rebuilding..." >&2
  rm -rf "$VENV"
fi

# Prefer python3.11 to match CI + the runtime Docker image; fall back to
# any python3 on PATH so contributors on newer Python versions aren't blocked.
PYTHON_BIN=""
for candidate in python3.11 python3.12 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then
    PYTHON_BIN="$candidate"
    break
  fi
done

if [ -z "$PYTHON_BIN" ]; then
  echo "bootstrap-python-venv: no python3 found on PATH" >&2
  exit 1
fi

echo "bootstrap-python-venv: creating $SERVICE_DIR/$VENV using $PYTHON_BIN..." >&2
"$PYTHON_BIN" -m venv "$VENV"

echo "bootstrap-python-venv: installing $SERVICE_DIR with [dev] extras..." >&2
"$VENV/bin/pip" install --quiet --upgrade pip
"$VENV/bin/pip" install --quiet -e ".[dev]"

echo "bootstrap-python-venv: done." >&2
