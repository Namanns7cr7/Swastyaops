# 12 — Testing Strategy

**Status:** Approved · **Owner:** Engineering · **Last updated:** 2026-07-06
**Related:** [TRD](02_TRD.md) · [API Spec](05_API_Specification.md) · [AI Architecture](06_AI_Architecture.md) §8 · [PRD](01_PRD.md) §11 (acceptance gates) · Code: [backend/tests/](../backend/tests/), frontend `*.test.tsx`

Philosophy: the pyramid holds, with one addition — **agent behavior is tested like code** (versioned eval sets, CI thresholds), because prompts change more often than code and regress just as silently.

---

## 1. Test levels & gates

| Level | Scope | Tooling | Runs | Gate |
|---|---|---|---|---|
| Unit | Pure logic: stock math, threshold engine, envelope builders, conflict resolution | pytest, vitest | Every PR | 100% pass; coverage ≥ 80% on `app/core`, `app/models` |
| Component | FastAPI routes w/ Firestore + Pub/Sub emulators; React components w/ Testing Library | pytest + emulators, vitest | Every PR | 100% pass |
| Contract | API ↔ OpenAPI drift; Pub/Sub messages ↔ topic schemas; TS client types ↔ OpenAPI | schemathesis, buf-style proto checks, openapi-typescript diff | Every PR | Zero drift |
| Rules | Firestore security rules matrix (role × collection × op) | `@firebase/rules-unit-testing` | Every PR | 100% of matrix |
| Agent evals | 6 suites per [AI Architecture](06_AI_Architecture.md) §8 | pytest + Vertex AI eval service | Smoke on PR; full nightly + on any prompt/model change | Suite thresholds |
| E2E | 8 critical journeys (§3) on staging | Playwright | Nightly + release | 100% pass |
| Load | NFR-2/3/5 targets | k6 | Release + weekly staging | P95 within SLO |
| Chaos/DR | Degradation ladder + failover | scripted drills | Sprint 11, then quarterly | Runbook criteria |
| A11y | WCAG AA per screen, both themes | axe-core in Playwright + Storybook | Every PR | Zero serious/critical violations |

## 2. Emulator-first local stack

`make test` runs Firestore emulator + Pub/Sub emulator + fake Gemini (recorded fixtures) — no GCP project needed for PR checks. Recorded Gemini fixtures are refreshed weekly by a scheduled job that re-runs the fixture set against live models and diffs structured outputs (drift alarm, not auto-update).

## 3. E2E critical journeys (Playwright, staging)

1. Pharmacist offline stock issue → airplane mode → reconnect → command center shows update < 15 s (AC-A1).
2. Voice footfall entry (fixture audio) → confirmation → record correct (AC-A2 spot check; full set in evals).
3. Stock-out forecast on seeded burn → alert → recommendation → DHO edit-and-approve → order PDF + facility notification (AC-B1/B2).
4. Approval against stale snapshot → `409 STALE_VALIDITY_SNAPSHOT` → agent re-plan surfaces new draft.
5. Outbreak scenario seed (footfall spike ×3 facilities + monsoon weather fixture) → outbreak alert with GeoJSON → fan-out checks visible.
6. Daily briefing dry-run → EN+HI text + audio + PDF, all citations resolve (AC-C3 building block).
7. NL query returns cited answer; repeat query served from semantic cache (< 1 s).
8. Role matrix probe: each of 7 roles attempts each screen + a forbidden API call → correct allow/deny ([Security](13_Security.md) §4).

## 4. Contract testing detail

- **API:** schemathesis fuzzes every endpoint from the served OpenAPI; hand-written examples in [API Spec](05_API_Specification.md) §6 are executed as literal request fixtures — doc and implementation cannot diverge.
- **Events:** every publisher test validates against the Pub/Sub schema registry; a `consumer_expectations.yaml` per subscriber pins required fields, so producers can't drop fields consumers rely on.
- **Idempotency:** every mutating endpoint gets an automatic replay test (same key+payload → replayed response; same key+different payload → 409) generated from the route table.

## 5. Data & pipeline tests

- ELT `MERGE` queries run against BigQuery emulator-substitute (queries executed on a scratch dataset in dev with golden inputs → golden outputs).
- Ingestion parsers ([Data Pipeline](14_Data_Pipeline.md)) tested on captured real files (HMIS export quirks: merged cells, Hindi headers, format drift) — every historical parsing bug becomes a fixture.
- Forecast sanity harness: synthetic series with known seasonality → MAPE bound; stock-out date math property-tested (`hypothesis`).

## 6. Load profile (k6)

| Scenario | Load | Assert |
|---|---|---|
| Morning command-center spike | 500 VU, 10 min ramp, 60 min soak | P95 read < 800 ms, error < 0.5% |
| Facility write storm (sync after outage) | 5 k queued mutations replayed in 5 min via `/sync/batch` | All applied, zero dupes, backlog drains < 10 min |
| Event fan-out | 50 events/s sustained 15 min | DLQ empty, dashboard freshness < 15 s P95 |
| NL query burst | 30 concurrent | P95 < 12 s, semantic cache hit path < 1 s |

## 7. Agent eval operations

Thresholds and suites in [AI Architecture](06_AI_Architecture.md) §8. Operational rules: prompt changes ship only with eval run linked in the PR; nightly full run posts a scorecard to the team channel; every DHO rejection auto-queues for triage and monthly promotion into eval sets; model version upgrades run the full suite ×3 (variance check) before adoption.

## 8. Accessibility verification

axe-core on all 16 screens × 2 themes × 3 breakpoints in CI (zero serious+); manual NVDA (desktop) + TalkBack (Android PWA) walkthrough of journeys 1, 3, 6 each release; contrast checked at token level so regressions are impossible without touching `tokens.ts` (which requires design review — [UI/UX](09_UI_UX_Guidelines.md) §8).

## 9. Release checklist (mechanized in deploy.yml)

PR green across all §1 gates → staging: E2E + load smoke + eval smoke → canary 10%/30 min watching SLO burn + error ratio → promote. Rollback tested monthly by deliberately canarying a fault build in staging.
