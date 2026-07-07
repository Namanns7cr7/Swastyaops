"""Agent registry: loads /prompts/*.md, binds tools, wraps Vertex AI Agent Engine.

Prompt files carry semver front-matter; agent_runs records prompt_version + model for
every run (docs/06_AI_Architecture.md §3, §9). Tool bindings per agent follow
docs/07_Agent_Design.md; tools are the only data access agents have (ADR-0004).
"""

import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Callable

from app.agents.tools import base as base_tools
from app.core.config import settings

PROMPTS_DIR = Path(__file__).resolve().parents[2] / "prompts"

AGENT_TOOLS: dict[str, list[Callable[..., Any]]] = {
    "planner": base_tools.BASE + [base_tools.dispatch_task, base_tools.get_plan_status],
    "inventory": base_tools.BASE + [base_tools.find_donor_facilities, base_tools.get_indent_calendar],
    "forecast": base_tools.BASE + [base_tools.get_model_metrics],
    "disease_intelligence": base_tools.BASE + [base_tools.get_idsp_reports, base_tools.spatial_cluster],
    "doctor": base_tools.BASE + [base_tools.get_attendance_history, base_tools.get_sanctioned_vs_actual],
    "bed": base_tools.BASE + [base_tools.find_available_beds],
    "laboratory": base_tools.BASE + [base_tools.find_alternative_lab],
    "recommendation": base_tools.BASE + [base_tools.create_recommendation, base_tools.take_validity_snapshot],
    "report": base_tools.BASE + [base_tools.get_kpi_series, base_tools.request_render],
    "notification": base_tools.BASE + [base_tools.resolve_recipients, base_tools.enqueue_notification],
    "executive_briefing": base_tools.BASE + [base_tools.get_overnight_delta, base_tools.request_render],
}

_FRONTMATTER = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)


@dataclass
class AgentApp:
    name: str
    prompt: str
    prompt_version: str
    model: str
    tools: list[Callable[..., Any]]

    async def run(self, *, task: dict, district_id: str, run_ref) -> dict:
        """Execute one task through the Agent Engine tool loop.

        The loop itself is Vertex AI Agent Engine (managed sessions, constrained
        decoding via each task_type's response_schema); this wrapper injects the
        district context block (cached, docs/06 §6), enforces token budgets, and
        appends each tool call to run_ref for the audit transcript.
        """
        from app.agents.runtime import execute  # vertexai.agent_engines wrapper

        return await execute(agent=self, task=task, district_id=district_id, run_ref=run_ref)


@lru_cache
def get_agent(name: str) -> AgentApp:
    path = PROMPTS_DIR / f"{name}_agent.md"
    text = path.read_text(encoding="utf-8")
    meta_block = _FRONTMATTER.match(text)
    if not meta_block:
        raise ValueError(f"Prompt {path.name} missing front-matter")
    meta = _parse_frontmatter(meta_block.group(1))
    return AgentApp(
        name=name,
        prompt=text[meta_block.end():],
        prompt_version=meta["version"],
        model=settings().model_pro if "pro" in meta["model"] else settings().model_flash,
        tools=AGENT_TOOLS[name],
    )


def _parse_frontmatter(block: str) -> dict[str, str]:
    """key: value lines → dict; skips comment lines, drops trailing `# ...` comments."""
    meta: dict[str, str] = {}
    for line in block.splitlines():
        if ":" not in line or line.lstrip().startswith("#"):
            continue
        key, _, value = line.partition(":")
        meta[key.strip()] = value.split("#")[0].strip()
    return meta
