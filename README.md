# SwasthyaOps AI

**AI Operating System for District Healthcare** — an AI Command Center that gives District Health Officers real-time operational visibility and agent-driven intervention across every Primary Health Centre (PHC) and Community Health Centre (CHC) in a district.

> Reference pilot deployment: **District Sikar, Rajasthan** — 89 PHCs, 21 CHCs, 1 District Hospital, ~2.7M population.

---

## Why

PHCs and CHCs across India run blind: medicine stock-outs are discovered when a patient is turned away, doctor absenteeism surfaces in quarterly audits, bed and diagnostic availability is unknown outside the facility, and district intervention arrives weeks late. HMIS reporting is monthly and retrospective. SwasthyaOps AI turns district healthcare into an **observable, forecastable, and actionable system** — the way SRE transformed software operations.

## What it does

| Capability | Powered by |
|---|---|
| Live district command center (stock, staff, beds, labs, footfall) | Firestore + Cloud Run + Next.js |
| Stock-out prediction 21 days ahead | BigQuery ML (`ARIMA_PLUS`) + Forecast Agent |
| Outbreak early-warning from footfall + IDSP + weather signals | Disease Intelligence Agent (Gemini on Vertex AI Agent Engine) |
| Auto-drafted transfer orders, indent escalations, staffing actions | Recommendation Agent + Planner Agent |
| Daily 07:00 IST executive briefing in Hindi + English, text + voice | Executive Briefing Agent + Text-to-Speech + Translation API |
| Voice-first data entry for facility staff (Hindi/Rajasthani) | Speech-to-Text + Gemini structured extraction |
| Offline-first facility app | PWA + Firestore offline persistence |

## Architecture in one paragraph

Every state change in the district (a stock transaction, an attendance punch, a bed status flip, a lab result) is published to **Pub/Sub**. Stateless **Cloud Run** services consume events, maintain the operational state in **Firestore** (serving) and **BigQuery** (analytics/ML), and dispatch work to eleven specialized **Vertex AI Agent Engine** agents coordinated by a Planner Agent. Agents read tools, not databases: every capability is a typed tool backed by the same REST API humans use. See [docs/03_System_Architecture.md](docs/03_System_Architecture.md).

## Repository map

```
/docs                 Product, technical, and operational documentation (start here)
/architecture         Service catalog, event catalog, Pub/Sub topic registry, ADRs
/prompts              System prompts for all 11 Vertex AI agents (versioned, evaluated)
/backend              Python 3.12 / FastAPI services (svc-api, svc-ingestion, svc-agents, ...)
/frontend             Next.js 14 / TypeScript / Tailwind / MUI command-center web app
/mobile               Offline-first PWA for facility staff (shares frontend design tokens)
/infra                Terraform (all GCP resources), Cloud Build, Dockerfiles
/scripts              Seeding, ingestion backfills, dataset creation, deploy helpers
/stitch_screens       Material 3 design tokens & screen exports (design source of truth)
/.github/workflows    CI (lint/test) and CD (Cloud Build trigger) pipelines
```

## Documentation index

| # | Document | What it answers |
|---|---|---|
| — | [README.md](README.md) | What is this, where do I start |
| 01 | [PRD](docs/01_PRD.md) | Why we build it, for whom, how success is measured |
| 02 | [TRD](docs/02_TRD.md) | Technical requirements: services, scaling, retries, caching, observability |
| 03 | [System Architecture](docs/03_System_Architecture.md) | Components, event flows, deployment topology |
| 04 | [Database Schema](docs/04_Database_Schema.md) | Firestore collections, BigQuery tables, indexes, TTL, security rules |
| 05 | [API Specification](docs/05_API_Specification.md) | OpenAPI 3.1 REST surface, auth, errors, rate limits |
| 06 | [AI Architecture](docs/06_AI_Architecture.md) | Gemini usage, tool calling, fallbacks, cost, evaluation |
| 07 | [Agent Design](docs/07_Agent_Design.md) | All 11 agents: purpose → topics → collections → failure handling |
| 08 | [App Flow](docs/08_App_Flow.md) | Every screen, every role, desktop/tablet/mobile/offline/voice |
| 09 | [UI/UX Guidelines](docs/09_UI_UX_Guidelines.md) | Material 3 tokens, accessibility (WCAG AA), dark mode |
| 10 | [Deployment Guide](docs/10_Deployment_Guide.md) | Terraform → Cloud Build → Cloud Run/Firebase, step by step |
| 11 | [Implementation Plan](docs/11_Implementation_Plan.md) | 12 sprints from empty project to district pilot |
| 12 | [Testing Strategy](docs/12_Testing_Strategy.md) | Unit → contract → agent evals → load → chaos |
| 13 | [Security](docs/13_Security.md) | IAM matrix, DPDP Act 2023, ABDM alignment, threat model |
| 14 | [Data Pipeline](docs/14_Data_Pipeline.md) | HMIS, NFHS, RHS, IDSP, weather, population, Maps — ingestion to AI usage |
| 15 | [Presentation](docs/15_Presentation.md) | 5-minute pitch, demo script, architecture walkthrough |
| 16 | [Future Roadmap](docs/16_Future_Roadmap.md) | State scale-out, ABDM integration, what we deliberately deferred |

## Canonical names (used identically in every document and every file)

| Concept | Convention | Examples |
|---|---|---|
| GCP project | `swasthyaops-{env}` | `swasthyaops-dev`, `swasthyaops-prod` |
| Region | `asia-south1` (Mumbai), DR: `asia-south2` (Delhi) | — |
| Cloud Run services | `svc-{name}` | `svc-api`, `svc-ingestion`, `svc-agents`, `svc-forecast`, `svc-notify`, `svc-reports` |
| Pub/Sub topics | `{domain}.{entity}.{event}` (past tense for facts, imperative for commands) | `facility.inventory.updated`, `alerts.stockout.predicted`, `agents.tasks.dispatch` |
| Dead-letter topics | `{topic}.dlq` | `facility.inventory.updated.dlq` |
| Firestore | root collections, `{entity}Id` keys | `facilities/{facilityId}/inventory/{itemId}` |
| BigQuery datasets | `swasthyaops_raw`, `swasthyaops_curated`, `swasthyaops_ml`, `swasthyaops_analytics` | — |
| Service accounts | `sa-{service}@swasthyaops-{env}.iam.gserviceaccount.com` | `sa-svc-api@...` |
| API | `https://api.{env}.swasthyaops.in/v1` | — |
| Agents | `{Name} Agent` (11 total) | Planner, Inventory, Forecast, Disease Intelligence, Doctor, Bed, Laboratory, Recommendation, Report, Notification, Executive Briefing |

## Quickstart (local development)

Prerequisites: `gcloud` ≥ 480, Terraform ≥ 1.8, Python 3.12, Node 20, Docker.

```bash
# 1. Provision a dev project (one-time; see docs/10_Deployment_Guide.md for full detail)
cd infra/terraform
terraform init -backend-config="bucket=swasthyaops-tf-state"
terraform apply -var="project_id=swasthyaops-dev" -var="env=dev"

# 2. Backend
cd ../../backend
pip install -e ".[dev]"
export GOOGLE_CLOUD_PROJECT=swasthyaops-dev
uvicorn app.main:app --reload --port 8080

# 3. Frontend
cd ../frontend
npm install && npm run dev   # http://localhost:3000

# 4. Seed reference data (Sikar facilities, medicine catalog, demo users)
python scripts/seed_firestore.py --project swasthyaops-dev
```

## License & data governance

Application code © 2026 SwasthyaOps. Public datasets (HMIS, NFHS-5, RHS, IDSP) are used under Government of India open data licenses; no personally identifiable patient data is ingested — see [docs/13_Security.md](docs/13_Security.md) §2 and [docs/14_Data_Pipeline.md](docs/14_Data_Pipeline.md) §1.
