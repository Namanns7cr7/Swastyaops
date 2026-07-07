"""Vertex AI Agent Engine execution wrapper (docs/06_AI_Architecture.md §2).

Owns the tool loop invocation for a single task: injects the cached district context
block, enforces per-run token budgets (docs/06 §6), appends every tool call to the
agent_runs transcript, and applies the L1–L3 fallback ladder (docs/06 §5).

Lands in Sprint 6 with svc-agents (docs/11_Implementation_Plan.md); until then it
follows the same fail-loudly convention as the sprint-scheduled tools in
app/agents/tools/base.py so evals and smoke tests report it precisely.
"""

from typing import Any

from google.cloud.firestore import DocumentReference

from app.agents import registry


async def execute(
    *,
    agent: "registry.AgentApp",
    task: dict[str, Any],
    district_id: str,
    run_ref: DocumentReference,
) -> dict[str, Any]:
    raise NotImplementedError(
        "Agent Engine runtime lands in Sprint 6 (docs/11_Implementation_Plan.md); "
        f"cannot execute task_type={task.get('task_type')!r} for agent={agent.name!r} yet."
    )
