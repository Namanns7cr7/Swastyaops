# Spec: SwasthyaOps AI

> The working source of truth for engineers and AI agents contributing to this repo.
> Deep detail lives in [/docs](docs/) — this file is the operational summary and the
> contract for how changes get made. If this file and reality diverge, fix this file
> in the same PR. Last updated: 2026-07-08.

## Objective

An **AI Operating System for district healthcare**: real-time operational visibility
(stock, staffing, beds, labs, footfall) plus agent-drafted, human-approved interventions
for District Health Officers. Reference pilot: District Sikar, Rajasthan (~110 facilities,
~2.7M population). Full product rationale and personas: [docs/01_PRD.md](docs/01_PRD.md).

Success (12-month pilot, PRD §2): ≥80% of stock-outs predicted ≥14 days ahead; doctor
absence flagged within 24h; anomaly → approved intervention < 8 working hours; outbreak
detection ≥7 days ahead of the IDSP weekly cycle; ≥85% of briefing recommendations rated
actionable.

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | Python 3.12+ / FastAPI / Pydantic v2 | Six Cloud Run services, one codebase/image ([backend/README.md](backend/README.md)) |
| Serving data | Firestore (logical multi-tenancy) | ADR-0002, ADR-0003 |
| Analytics/ML | BigQuery + BQML (`ARIMA_PLUS`) | Datasets in [docs/04](docs/04_Database_Schema.md) §3 |
| Events | Pub/Sub (over Kafka) | ADR-0001; topic registry mirrored in `app/core/pubsub.py` |
| Agents | Vertex AI Agent Engine, Gemini 2.5 flash/pro | ADR-0004; model ids are config, never hard-coded |
| Frontend | Next.js 14 / TypeScript / Tailwind + MUI v6 (Material 3) | Tokens compiled from `/stitch_screens` — the only color source |
| Mobile | Offline-first PWA | Outbox → `POST /v1/sync/batch` |
| Infra | Terraform + Cloud Build → Cloud Run / Firebase Hosting | [docs/10](docs/10_Deployment_Guide.md) |

## Commands

```bash
# Backend (run from /backend)
pip install -e ".[dev]"                 # setup
python -m pytest tests -q              # full suite; emulator-free unit/integration tests run anywhere
ruff check app tests                    # lint (line-length 100, rules E,F,I,B,UP,S)
mypy app                                # strict typing
uvicorn app.main:app --reload --port 8080   # local svc-api (needs Firestore/PubSub emulators for real I/O)

# Emulators (for component-level tests and local serving)
gcloud emulators firestore start --host-port=localhost:8686
# then: export FIRESTORE_EMULATOR_HOST=localhost:8686 PUBSUB_EMULATOR_HOST=localhost:8085

# Frontend (run from /frontend)
npm install && npm run dev              # http://localhost:3000
npm run build                           # production build; deploys go through CI
```

## Project Structure

```
docs/            Product/technical/operational documentation (numbered, cross-linked)
architecture/    Service catalog, event catalog, ADRs — decisions live here
prompts/         System prompts for all 11 agents (semver front-matter, eval-gated)
backend/app/     core/ (config, auth, firestore, pubsub, errors) · models/ · routers/
                 agents/ (registry, runtime, tools/) · ingestion/ forecast/ notify/ reports/
backend/tests/   unit/ integration/ (component/ contract/ rules/ evals/ per docs/12 §1)
frontend/src/    app/ (App Router) · theme/tokens.ts · lib/ · components/
mobile/pwa/      Offline outbox + manifest (shares frontend design tokens)
infra/           Terraform, Cloud Build, Firestore rules
scripts/         Seeding, smoke tests, ELT SQL, deploy helpers
```

## Code Style

Backend exemplar — every module carries a docstring citing the doc section it implements;
handlers are thin (auth → validate → Firestore txn → event); errors are `ApiError` subclasses:

```python
"""Inventory write path — validate → Firestore transaction → domain event.
Flow: docs/03_System_Architecture.md §4.1; API contract: docs/05 §6.2."""

@router.post("/transactions", response_model=InventoryTransactionOut, status_code=201)
async def create_transaction(
    facility_id: str,
    body: InventoryTransactionIn,          # Pydantic v2, pattern-validated fields
    principal: Principal = require_roles("pharmacist", "facility_incharge"),
) -> InventoryTransactionOut:
    principal.assert_facility(facility_id)  # tenancy from JWT claims ONLY (ADR-0003)
    ...
    write_and_publish(writes=[...], event=envelope("facility.inventory.updated", ...))
```

Conventions: `ruff` (E,F,I,B,UP,S; line length 100) and `mypy --strict` are the arbiter;
snake_case modules; typed tool I/O via Pydantic models; agents return digests not dumps.
Frontend: tsc strict, `no-raw-colors` lint (design tokens only), no hardcoded UI strings
(i18n keys in `lib/i18n/`).

## Testing Strategy

Full ladder in [docs/12_Testing_Strategy.md](docs/12_Testing_Strategy.md). The pyramid
holds, plus **agent behavior is tested like code** (versioned eval suites, CI thresholds).

- **Unit** (`backend/tests/unit/`): pure logic — stock math, error envelope, auth scoping,
  event envelope, prompt registry, tenancy guards. pytest + hypothesis; no GCP, no network.
- **Integration** (`backend/tests/integration/`): FastAPI routes via TestClient with
  in-memory Firestore/outbox fakes (see `test_inventory_router.py` for the pattern).
  Emulator-backed component tests land per the sprint plan.
- **Contract / rules / evals / E2E / load**: per docs/12 §1 gates as those layers land.
- Gates: 100% pass on every PR; coverage ≥ 80% on `app/core` and `app/models`.
- Bug fixes follow the Prove-It pattern: a failing reproduction test precedes the fix.

## Boundaries

**Always**
- Publish a domain event for every Firestore mutation via `write_and_publish` (invariant #2).
- Derive district/facility scope from verified JWT claims only — never from request input.
- Register any new event type in `architecture/` and `app/core/pubsub.TOPICS` before publishing.
- Run `pytest` + `ruff` before committing backend changes; keep module docstrings citing docs.
- Access data from agents exclusively through typed tools in `app/agents/tools/`.

**Ask first**
- Firestore/BigQuery schema changes, new collections, or index changes.
- Adding dependencies, new Pub/Sub topics, or new Cloud Run services.
- Editing agent prompts (`/prompts`) — prompt changes ship only with a linked eval run.
- Changing CI/CD (`infra/cloudbuild.yaml`, workflows) or Terraform.

**Never**
- Commit secrets or service-account keys; secrets arrive via Secret Manager mounts only.
- Hard-code model ids, project ids, or colors (config / tokens only).
- Call one backend service from another over HTTP (services communicate via events).
- Delete or skip failing tests to make a suite pass.
- Let agents compose raw SQL or read databases directly.

## Success Criteria (per change)

A change is done when: its behavior is covered by tests at the right pyramid level; the
full backend suite passes; lint/type gates pass; docs/ADRs are updated if a decision or
contract changed; and this SPEC.md still tells the truth.

## Open Questions / Assumptions

- Sprint status: routers beyond inventory (facilities, footfall, sync, alerts…) and the
  Agent Engine runtime (`app/agents/runtime.py`) are stubs pending their sprints
  ([docs/11](docs/11_Implementation_Plan.md)); stubs fail loudly by design.
- `make test` (emulator-first stack, docs/12 §2) is not yet wired in this repo; current
  tests run emulator-free by design. Assumed acceptable until component tests land.
- Frontend test tooling (vitest + Playwright/axe) is specified in docs/12 but not yet
  present in `/frontend` — assumed to land with the frontend test sprint.
