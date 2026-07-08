"""Unit tests for prompt loading and agent binding (docs/06 §3/§9, docs/07)."""

import re

import pytest

from app.agents import registry
from app.agents.registry import AGENT_TOOLS, _parse_frontmatter, get_agent
from app.core.config import settings

SEMVER = re.compile(r"^\d+\.\d+\.\d+$")


# ── _parse_frontmatter ───────────────────────────────────────────────────────

def test_parses_key_value_lines():
    meta = _parse_frontmatter("agent: planner\nversion: 1.4.0\nmodel: gemini-2.5-pro")
    assert meta == {"agent": "planner", "version": "1.4.0", "model": "gemini-2.5-pro"}


def test_skips_comment_lines_and_strips_trailing_comments():
    block = "# release notes\nversion: 1.3.0\neval_suite: recommendation_quality   # shared"
    meta = _parse_frontmatter(block)
    assert meta == {"version": "1.3.0", "eval_suite": "recommendation_quality"}


def test_ignores_lines_without_a_colon():
    assert _parse_frontmatter("just prose\nversion: 1.0.0") == {"version": "1.0.0"}


# ── get_agent ────────────────────────────────────────────────────────────────

def test_every_registered_agent_has_a_loadable_versioned_prompt():
    for name in AGENT_TOOLS:
        agent = get_agent(name)
        assert agent.name == name
        assert SEMVER.match(agent.prompt_version), f"{name}: bad version {agent.prompt_version}"
        assert agent.model in {settings().model_flash, settings().model_pro}
        assert agent.tools is AGENT_TOOLS[name]
        # front-matter must be stripped from the served prompt
        assert not agent.prompt.startswith("---")
        assert "version:" not in agent.prompt.split("\n", 1)[0]


def test_pro_frontmatter_selects_the_pro_model():
    assert get_agent("planner").model == settings().model_pro


def test_missing_frontmatter_fails_loudly(monkeypatch, tmp_path):
    (tmp_path / "bogus_agent.md").write_text("no front-matter here", encoding="utf-8")
    monkeypatch.setattr(registry, "PROMPTS_DIR", tmp_path)
    get_agent.cache_clear()
    try:
        with pytest.raises(ValueError, match="missing front-matter"):
            get_agent("bogus")
    finally:
        get_agent.cache_clear()  # do not leak tmp_path-backed entries to other tests


def test_unknown_agent_name_raises():
    with pytest.raises((FileNotFoundError, KeyError)):
        get_agent("nonexistent")
    get_agent.cache_clear()
