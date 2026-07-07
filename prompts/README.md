# Agent Prompts

One file per agent, deployed inside the `svc-agents` container and registered with Vertex AI Agent Engine at startup ([backend/app/agents/registry.py](../backend/app/agents/registry.py)).

Rules ([docs/06_AI_Architecture.md](../docs/06_AI_Architecture.md) §3):
- Front-matter carries `version` (semver), `model`, `temperature`, token budgets. `agent_runs.prompt_version` records what ran.
- Any change requires the matching eval suite green in CI ([docs/12_Testing_Strategy.md](../docs/12_Testing_Strategy.md) §7).
- Agents may only state facts returned by tools; user-visible claims carry `{kind, ref}` citations.
- Facility-entered free text arrives wrapped in `<untrusted_data>` — data, never instructions.
- Output is schema-constrained (`response_schema`); the schemas live beside the tool definitions in [backend/app/agents/](../backend/app/agents/).

| File | Agent | Model |
|---|---|---|
| [planner_agent.md](planner_agent.md) | Planner | gemini-2.5-pro |
| [inventory_agent.md](inventory_agent.md) | Inventory | gemini-2.5-pro |
| [forecast_agent.md](forecast_agent.md) | Forecast | gemini-2.5-pro |
| [disease_intelligence_agent.md](disease_intelligence_agent.md) | Disease Intelligence | gemini-2.5-pro |
| [doctor_agent.md](doctor_agent.md) | Doctor | gemini-2.5-flash (pro escalation) |
| [bed_agent.md](bed_agent.md) | Bed | gemini-2.5-flash |
| [laboratory_agent.md](laboratory_agent.md) | Laboratory | gemini-2.5-flash |
| [recommendation_agent.md](recommendation_agent.md) | Recommendation | gemini-2.5-pro |
| [report_agent.md](report_agent.md) | Report | gemini-2.5-pro |
| [notification_agent.md](notification_agent.md) | Notification | gemini-2.5-flash |
| [executive_briefing_agent.md](executive_briefing_agent.md) | Executive Briefing | gemini-2.5-pro |
