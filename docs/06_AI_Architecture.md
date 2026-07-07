# 06 — AI Architecture

**Status:** Approved · **Owner:** AI Engineering · **Last updated:** 2026-07-06
**Related:** [Agent Design](07_Agent_Design.md) · [System Architecture](03_System_Architecture.md) · [Data Pipeline](14_Data_Pipeline.md) · Prompts: [/prompts](../prompts/) · Runtime: [backend/app/agents/](../backend/app/agents/)

---

## 1. Model strategy

| Workload | Model | Why |
|---|---|---|
| High-volume structured tasks: voice extraction, event triage, alert composition, notification drafting | **Gemini 2.5 Flash** | Latency + cost; tasks are extraction/classification with strict schemas |
| Reasoning tasks: planning, outbreak correlation, recommendation drafting, NL district queries, executive briefing | **Gemini 2.5 Pro** | Multi-step tool use over ambiguous evidence |
| Time-series forecasting | **BigQuery ML `ARIMA_PLUS`** (no LLM) | Deterministic, cheap, auditable — LLMs don't forecast counts ([ADR-0004](../architecture/adr/0004-agent-engine.md) scope note) |
| Speech, voice output, translation | Speech-to-Text v2 (`hi-IN`, `en-IN`), Text-to-Speech (Wavenet `hi-IN`), Translation API | Managed, on-region |

Model IDs are configuration (`config/thresholds` + env), never hard-coded; every `agent_runs` record stores the exact model version used.

## 2. Runtime: Vertex AI Agent Engine

All eleven agents ([Agent Design](07_Agent_Design.md)) run as Agent Engine apps hosted from `svc-agents`:
- **Sessions** — interactive flows (NL query) get user-scoped sessions with 24 h expiry; batch agents (Forecast, Report) run sessionless single-shot tasks.
- **Memory Bank** — district-scoped durable memory: DHO preferences ("always CC the BCMO on Fatehpur"), rejected-recommendation patterns, facility idiosyncrasies. Memory writes are explicit tool calls (`remember_fact`), never implicit, and are readable in the admin UI for audit.
- **Tool loop** — Agent Engine executes the Gemini function-calling loop; tools are Python functions in [backend/app/agents/tools/](../backend/app/agents/tools/) with Pydantic-validated I/O, running under `sa-svc-agents` least-privilege identity ([Security](13_Security.md) §5).
- **Tracing** — every run traced to Cloud Trace; full tool-call transcript persisted to `agent_runs` ([Database Schema](04_Database_Schema.md) §1.5).

## 3. Prompt engineering

Standards applied to every prompt in [/prompts](../prompts/):

1. **Versioned artifacts.** Prompts are files (`prompts/{agent}.md`) with semver front-matter, deployed as part of the container image; `agent_runs.prompt_version` records which version produced any output. Changing a prompt requires passing the eval suite (§8) in CI.
2. **Structure:** role → operating context (district healthcare, Indian government norms) → task contract → tool usage rules → output JSON schema → refusal/uncertainty rules → few-shot examples (2–3, drawn from eval set).
3. **Grounding mandate.** Agents may only state facts returned by tools. Every claim in user-visible output carries a citation (`{kind, ref}`) which the frontend renders as a drill-down link. Output failing citation validation is rejected by the runtime and retried once with the validator error appended (self-correction), then falls back (§5).
4. **Structured output.** All non-chat agents emit JSON conforming to Pydantic schemas via Gemini `response_schema` (constrained decoding) — not "please respond in JSON".
5. **Language.** Agents compose in English; Hindi via Translation API at the edge (one canonical text, no bilingual drift). The exception is voice extraction, which processes Hindi natively.
6. **Injection defense.** All facility-entered free text (notes, voice transcripts) is wrapped in delimited `<untrusted_data>` blocks with an instruction hierarchy note; agents treat it as data, never instructions ([Security](13_Security.md) §8).

## 4. Reasoning chain (Planner-mediated)

The Planner Agent is the only agent that decomposes; specialists execute. Canonical flow for a complex trigger (e.g. `alerts.outbreak.suspected`):

```
1. TRIAGE      Planner receives task envelope → classifies scope (single-facility | multi-facility | district)
2. PLAN        Emits ordered task list with dependencies:
               [DiseaseIntel: confirm signal] → [Bed + Laboratory + Inventory: capacity checks, parallel]
               → [Recommendation: synthesize] → [Notification: route]
3. DISPATCH    Each step published to agents.tasks.dispatch with plan_id, step_id, depends_on[]
4. EXECUTE     svc-agents runs each specialist; results to agents.runs.completed
5. SYNTHESIZE  Planner (or Recommendation Agent for intervention drafting) merges step outputs;
               conflicting evidence → confidence downgrade + explicit uncertainty note, never silent resolution
6. GATE        Anything that changes the world (recommendation, notification) goes through
               human approval or deterministic policy check — agents never execute interventions
```

Plans are Firestore documents (`agent_runs` with `task_type=plan`), so a stuck plan is observable and resumable; a step failing 3× marks the plan `degraded` and surfaces a partial result with the failure noted.

## 5. Fallback ladder

| Level | Condition | Behavior |
|---|---|---|
| L0 | Normal | Full agent pipeline |
| L1 | Single Gemini call fails (5xx/timeout) | Retry ×3 jittered (1/2/4 s) |
| L2 | Schema/citation validation fails | One self-correction retry with validator errors appended |
| L3 | Pro unavailable / circuit open | Downshift Pro→Flash for that task with `degraded_model=true` flag on output (allowed for: alert composition, notification, briefing; **not** for recommendation drafting — those queue) |
| L4 | Gemini fully unavailable | Deterministic mode: svc-forecast threshold alerts continue; briefing rendered from Jinja template over `mv_command_center_tiles`; NL query returns `503 AI_DEGRADED` ([API Spec](05_API_Specification.md) §4); recommendation tasks queue in Pub/Sub (7-day retention) and drain on recovery |
| L5 | STT unavailable | PWA voice button disabled with toast; form entry always available |

Circuit breaker per [TRD](02_TRD.md) §11. Degradation state is a Cloud Monitoring metric and shows as a banner in the command center.

## 6. Caching & token optimization

- **Context caching (Vertex AI):** each agent's static block — system prompt + tool schemas + medicine catalog digest + district facility roster (~18 k tokens) — is cached with 1 h TTL; per-task dynamic context rides on top. Measured effect at pilot load: ~72% of input tokens served from cache.
- **Context diet:** tools return digests, not dumps — `query_stock_levels` returns top-N rows + aggregate, never full tables; BigQuery tools enforce `LIMIT` and column projection.
- **Semantic reuse:** NL query answers cached in Firestore keyed on `(district, normalized_query, data_version)` for 10 min — the morning "what's red today" pile-on hits cache.
- **Budgets:** per-run hard cap (Flash 32 k in/4 k out; Pro 96 k in/8 k out) enforced by the runtime; over-budget runs abort with `outcome=budget_exceeded` and page if recurring.

## 7. Cost estimation (per district / month, pilot load)

Assumptions: 110 facilities, ~4.4 k events/day, 30 NL queries/day, daily briefing, weekly reports. Prices: Gemini 2.5 Flash $0.15/M in · $0.60/M out; Pro $1.25/M in · $10/M out; cached input ≈ 25% of list.

| Workload | Model | Runs/mo | Avg tokens (in/out) | $/mo |
|---|---|---|---|---|
| Voice extraction | Flash | ~40 k | 1.2 k / 0.2 k | 12 |
| Event triage + alert composition | Flash | ~15 k | 3 k / 0.5 k | 11 |
| Notification drafting | Flash | ~6 k | 2 k / 0.3 k | 3 |
| Recommendation drafting | Pro | ~900 | 40 k (72% cached) / 3 k | 45 |
| Disease intelligence (daily + spikes) | Pro | ~60 | 60 k (cached) / 4 k | 4 |
| NL queries | Pro | ~900 | 30 k (cached) / 1.5 k | 25 |
| Executive briefing | Pro | 30 | 50 k (cached) / 5 k | 3 |
| STT (voice minutes) | STT v2 | 25 k min | — | 60 |
| TTS + Translation | — | — | — | 8 |
| BigQuery ML (train + predict) | BQML | — | ~80 GB processed | 25 |
| **Total AI** | | | | **≈ $196 (~₹16.5 k)** — within NFR-9 (₹18 k) |

Budget alert at $150 (75%); daily token-spend metric per agent on the ops dashboard ([TRD](02_TRD.md) §15).

## 8. Evaluation

Eval assets live in `swasthyaops-{env}-models/evals/`; runner: [backend/tests/evals/](../backend/tests/evals/) (pytest + Vertex AI Gen AI evaluation service). CI blocks prompt/model changes below thresholds.

| Suite | Method | Size | Threshold |
|---|---|---|---|
| Voice extraction | Golden set of Hindi/Hinglish utterances → exact-match on extracted fields | 200 | ≥ 90% field accuracy |
| Alert composition | Rubric LLM-judge (accuracy vs evidence, no hallucinated numbers) + citation validator | 120 | ≥ 95% citation-valid, 0 fabricated figures |
| Recommendation quality | Historical scenarios with known-good interventions; judge scores feasibility/safety/completeness 1–5 | 80 | mean ≥ 4.0, no safety score < 3 |
| Planner routing | Task envelope → expected agent sequence | 60 | ≥ 92% correct routing |
| NL query | Q&A pairs over seeded dataset; answer correctness + citation precision | 150 | ≥ 85% correct |
| Injection resistance | Adversarial payloads in `<untrusted_data>` (instruction smuggling, exfil attempts) | 50 | 100% resisted |

**Online:** every DHO rejection with `rejection_reason` ([API Spec](05_API_Specification.md) §6.3) is auto-added to a review queue; monthly triage promotes cases into eval sets. Weekly report: approval rate, edit distance of DHO edits, override patterns per agent.

## 9. Auditability

Non-negotiable (NFR-11): any output → `agent_runs/{runId}` → trigger event, prompt version, model version, full tool-call transcript, token/cost accounting, outcome. `agent_runs` mirrors permanently to BigQuery. An auditor can reconstruct *why the system recommended moving 40 ORS from Fatehpur* from a single document.
