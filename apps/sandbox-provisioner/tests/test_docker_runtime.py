"""Pure unit tests for the docker runtime helpers.

The container-touching paths (`create_container`, `exec_in`, etc.) need a real
docker socket and live in integration tests. This module covers the pure
helpers and the path-traversal guards that the FastAPI handlers depend on.
"""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.docker_runtime import parse_egress_allowlist
from app.main import _safe_path


class TestParseEgressAllowlist:
    def test_returns_empty_list_for_empty_string(self) -> None:
        assert parse_egress_allowlist("") == []

    def test_splits_on_commas_and_strips_whitespace(self) -> None:
        out = parse_egress_allowlist(" pypi.org , registry.npmjs.org ,github.com ")
        assert out == ["pypi.org", "registry.npmjs.org", "github.com"]

    def test_drops_empty_segments(self) -> None:
        assert parse_egress_allowlist("a,, , b,") == ["a", "b"]


class TestSafePath:
    def test_strips_leading_slashes(self) -> None:
        assert _safe_path("/index.ts") == "/workspace/index.ts"

    def test_prefixes_relative_paths_with_workspace(self) -> None:
        assert _safe_path("src/lib.ts") == "/workspace/src/lib.ts"

    def test_rejects_parent_directory_traversal(self) -> None:
        with pytest.raises(HTTPException) as excinfo:
            _safe_path("src/../../etc/passwd")
        assert excinfo.value.status_code == 400

    def test_rejects_a_bare_double_dot_segment(self) -> None:
        with pytest.raises(HTTPException) as excinfo:
            _safe_path("..")
        assert excinfo.value.status_code == 400

    def test_allows_dotfile_names_inside_a_segment(self) -> None:
        assert _safe_path(".env.local") == "/workspace/.env.local"
        assert _safe_path("src/.eslintrc.json") == "/workspace/src/.eslintrc.json"

    def test_allows_segments_that_only_contain_double_dots_in_their_name(self) -> None:
        assert _safe_path("dir..name/file") == "/workspace/dir..name/file"
