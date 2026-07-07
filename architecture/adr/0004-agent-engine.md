# ADR-0004 — Vertex AI Agent Engine over hand-rolled Gemini orchestration

**Status:** Accepted · 2026-05-26 · Deciders: tech lead, AI engineer
**Context refs:** [docs/06_AI_Architecture.md](../../docs/06_AI_Architecture.md) · [docs/07_Agent_Design.md](../../docs/07_Agent_Design.md)

## Context

Eleven agents need: a function-calling loop, session state for interactive flows, durable district-scoped memory, tracing, and a clean tool-permission boundary. The alternatives: (a) raw `generateContent` with our own loop/state/memory, (b) an OSS framework (LangGraph et al.) self-hosted on Cloud Run, (c) **Vertex AI Agent Engine** hosting our agent definitions, invoked from `svc-agents`.

## Decision

**(c) Agent Engine**, with three scope boundaries we own regardless of runtime:
1. **Tools are ours** — plain Python with Pydantic I/O ([backend/app/agents/tools/](../../backend/app/agents/tools/)), running under `sa-svc-agents`; the runtime never gets broader credentials.
2. **Audit is ours** — `agent_runs` in Firestore is the system of record, populated by `svc-agents` wrappers, independent of Agent Engine's internal traces.
3. **Forecasting is explicitly NOT an LLM job** — BigQuery ML owns the numbers; agents interpret ([AI Architecture](../../docs/06_AI_Architecture.md) §1). This scope note is part of the decision.

## Rationale

- Managed **sessions + Memory Bank** replace a meaningful chunk of stateful infrastructure we'd otherwise build on a platform whose rule is "every service is stateless" ([TRD](../../docs/02_TRD.md) §2) — the managed service absorbs the one stateful component.
- Native Gemini tool-loop with constrained decoding (`response_schema`) — the two features our hallucination defense depends on ([AI Architecture](../../docs/06_AI_Architecture.md) §3).
- Integrated with Vertex AI evaluation service, context caching, and Cloud Trace — our eval and cost strategies (§6–8) use these directly.
- Hand-rolled (a) was prototyped in a spike: the loop is easy; durable memory, session expiry, and trace correlation are the 80% that isn't. OSS frameworks (b) add a dependency treadmill without removing the state problem.

## Consequences

- Vendor coupling at the orchestration layer — mitigated by keeping prompts (markdown files), tools (plain Python), and audit (our schema) portable; a migration would swap the loop host only.
- Agent Engine regional availability and quota become launch dependencies — verified for `asia-south1`; quotas requested in [Deployment](../../docs/10_Deployment_Guide.md) §2 bootstrap.
- Per-session costs are part of the AI budget model ([AI Architecture](../../docs/06_AI_Architecture.md) §7).
