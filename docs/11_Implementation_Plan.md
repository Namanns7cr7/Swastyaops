# 11 — Implementation Plan

**Status:** Approved · **Owner:** Engineering Management · **Last updated:** 2026-07-06
**Related:** [PRD](01_PRD.md) §11 (gates A/B/C) · [TRD](02_TRD.md) · [Testing Strategy](12_Testing_Strategy.md) · [Deployment Guide](10_Deployment_Guide.md)

**Team:** 1 tech lead, 2 backend, 2 frontend, 1 AI engineer, 1 designer (50%), 1 PM, 1 field coordinator (from Sprint 6). **Cadence:** 2-week sprints, 12 sprints (~6 months) to pilot go-live, then 6 months piloting to the [PRD](01_PRD.md) §8 exit criteria.

Definition of Done (every story): code + tests green in CI, deployed to dev, doc deltas merged, demo in sprint review.

---

## Phase 0 — Foundations

### Sprint 1 — Walking skeleton
- Terraform bootstrap all three environments ([Deployment](10_Deployment_Guide.md) §2–3); CI/CD pipelines live (PR checks + dev auto-deploy).
- `svc-api` skeleton: auth middleware (Firebase JWT + claims), `/healthz`, `/readyz`, error envelope ([API Spec](05_API_Specification.md) §4), OpenAPI publishing.
- Pub/Sub topics + schemas from [architecture/pubsub_topics.yaml](../architecture/pubsub_topics.yaml); BigQuery datasets + `raw.events` subscription.
- Frontend shell: Next.js, theme from Stitch tokens, sign-in (S1), role routing.
- **Exit:** authenticated request → Firestore write → event → BigQuery row, observable in Cloud Trace end-to-end.

### Sprint 2 — Domain core
- Firestore schema + security rules + emulator tests; seed script (Sikar: 111 facilities from Health Centre Directory, EDL catalog, demo users) — [scripts/seed_firestore.py](../scripts/seed_firestore.py).
- Inventory endpoints (FR-1.1) with ledger, idempotency, event emission; footfall + attendance endpoints (FR-1.2–1.3).
- Facility directory + Facility 360 read APIs; S7 basic UI.
- **Exit:** pharmacist persona can manage stock via UI on dev, data lands in curated tables via hourly ELT.

## Phase 1 — Facility MVP → **Gate A**

### Sprint 3 — Offline PWA + remaining capture
- PWA outbox + `POST /v1/sync/batch` + conflict handling ([App Flow](08_App_Flow.md) §7); S8/S9/S11 mobile screens; beds + labs endpoints and boards (FR-1.4–1.5, S10).
- Snapshot denormalization on `facilities.snapshot`; stale-facility marking job.

### Sprint 4 — Voice + hardening
- Voice pipeline: STT v2 → Gemini Flash extraction → confirmation flow ([App Flow](08_App_Flow.md) §6); 200-utterance golden set + eval runner.
- Load test facility write path; a11y pass on facility screens.
- **Gate A review:** AC-A1 (offline→sync < 15 s), AC-A2 (voice ≥ 90%), AC-A3 (ELT ≤ 5 min) — [PRD](01_PRD.md) §11.

## Phase 2 — Intelligence & Command Center → **Gate B**

### Sprint 5 — Forecasting (deterministic path first)
- `svc-forecast`: consumption features view, `ARIMA_PLUS` training + daily batch predict, `forecasts` materialization, threshold engine → `alerts.stockout.predicted` ([Database Schema](04_Database_Schema.md) §3.3).
- Alert domain: `alerts` collection, inbox API, S3/S4 screens with evidence panel.
- Public-data ingestion v1: HMIS backfill, Health Centre Directory, weather daily ([Data Pipeline](14_Data_Pipeline.md)).

### Sprint 6 — Agent runtime + first agents
- `svc-agents`: task envelope handling, Agent Engine integration, tool library base, `agent_runs` audit, eval harness in CI ([AI Architecture](06_AI_Architecture.md)).
- Planner + Inventory + Recommendation agents ([Agent Design](07_Agent_Design.md) §1, 2, 8) with the stock-out → transfer flow ([Architecture](03_System_Architecture.md) §4.1).
- Field coordinator starts Sikar groundwork (MoU, facility staff roster).

### Sprint 7 — Command Center
- S2: KPI tiles (materialized view API), Google Maps district view, live alert stream; S5/S6 approval flow with validity re-check, order PDF (`svc-reports` v1), notifications to facilities (`svc-notify` v1: FCM + SMS).
- **Gate B review:** AC-B1–B3.

## Phase 3 — Full agent surface → **Gate C**

### Sprint 8 — Sensing agents
- Disease Intelligence (+ IDSP/NFHS ingestion, footfall anomaly view, spatial clustering), Doctor, Bed, Laboratory agents; alert classes wired through Notification Agent routing rules.

### Sprint 9 — Briefings & reports
- Executive Briefing Agent + Translation + TTS + S12; Forecast Agent (annotations, series health); Report Agent + monthly PDF + S13; briefing delivery SLO alarm ([TRD](02_TRD.md) §9).

### Sprint 10 — NL query + admin
- S14 Ask SwasthyaOps (SSE streaming, citations, semantic cache); S15 admin (user provisioning, onboarding wizard, audit log viewer, agent health); S16 settings; Hindi UI completion pass.

### Sprint 11 — Production hardening
- Full load test (500 VU soak — NFR targets), chaos drills (Gemini-down L4 ladder, Pub/Sub backlog, region failover rehearsal — [Deployment](10_Deployment_Guide.md) §9), security review + pen test ([Security](13_Security.md) §9), DPDP compliance sign-off, complete runbooks + on-call rota.

### Sprint 12 — Pilot readiness
- 14-day continuous staging burn-in with synthetic district (briefing streak per AC-C3); fix backlog; train-the-trainer materials (HI); Sikar staff training sessions; prod cutover checklist.
- **Gate C review → Go/No-Go with DHO + State NHM.**

## Phase 4 — Pilot (months 7–12, post-launch)

Rolling 2-week iterations driven by field feedback: weeks 1–2 onboard 10 pilot facilities → week 4 all 111; weekly agent-quality triage (rejection reasons → eval sets, [AI Architecture](06_AI_Architecture.md) §8); monthly KPI review vs [PRD](01_PRD.md) §4 baselines; month 9 mid-pilot review with state; month 12 exit evaluation against PRD §8 → scale-out decision ([Roadmap](16_Future_Roadmap.md)).

## Dependencies & critical path

```
S1 infra ─► S2 domain ─► S3 offline ─► S4 voice ─► GATE A
                  └────► S5 forecast ─► S6 agents ─► S7 command center ─► GATE B
                                             └────► S8 sensing ─► S9 briefings ─► S10 NL/admin ─► S11 hardening ─► S12 ─► GATE C
External (start Sprint 1, PM-owned): MoU with district administration · SMS DLT registration (6-week lead) · HMIS export access · staff rosters
```
Top schedule risks: SMS DLT approval (mitigate: start immediately, push-only fallback works), HMIS access (mitigate: platform generates its own primary data — [PRD](01_PRD.md) §7).
