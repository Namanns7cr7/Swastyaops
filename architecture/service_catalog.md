# Service Catalog

Rendered summary of the runtime surface. Normative sources: [docs/02_TRD.md](../docs/02_TRD.md) §2 (specs), [pubsub_topics.yaml](pubsub_topics.yaml) (wiring), [infra/terraform/cloudrun.tf](../infra/terraform/cloudrun.tf) (provisioning).

| Service | Image entrypoint | Ingress | Consumes (Pub/Sub) | Publishes | Data access | SA |
|---|---|---|---|---|---|---|
| `svc-api` | `app.main:app` | External (API Gateway) | — | `facility.*`, `recommendations.approved`, `agents.tasks.dispatch` (NL query), `reports.requested` (ad hoc) | Firestore RW | `sa-svc-api` |
| `svc-ingestion` | `app.ingestion.main:app` | Internal (Eventarc, Scheduler) | GCS finalize events | `ingest.*` | GCS ingest RO, BQ raw RW | `sa-svc-ingestion` |
| `svc-agents` | `app.agents.main:app` | Internal (Pub/Sub push) | `agents.tasks.dispatch` (11 filtered subs), `agents.runs.completed`, `facility.*` feeds, `alerts.*`, `recommendations.created`, `briefings.ready`, `forecasts.generated`, `ingest.*` | `agents.*`, `alerts.*` (agent-sourced), `recommendations.created`, `notifications.outbound`, `reports.requested`, `briefings.ready` | Firestore RW (scoped), BQ curated/ml RO, Vertex AI | `sa-svc-agents` |
| `svc-forecast` | `app.forecast.main:app` | Internal (Scheduler) | — | `forecasts.generated`, `alerts.stockout.predicted`, `alerts.footfall.spike` | BQ ml RW, Firestore `forecasts` RW | `sa-svc-forecast` |
| `svc-notify` | `app.notify.main:app` | Internal (Pub/Sub push) | `notifications.outbound` | — | Firestore `notifications` RW, Secret Manager | `sa-svc-notify` |
| `svc-reports` | `app.reports.main:app` | Internal (Pub/Sub push) | `reports.requested`, `recommendations.approved` (order PDFs) | `reports.generated` | GCS reports RW, BQ analytics RO, Firestore `reports`/`briefings` RW, TTS | `sa-svc-reports` |

Frontends: **web/PWA** — Firebase Hosting ([frontend/](../frontend/), [mobile/](../mobile/)), talks only to `svc-api` + Firestore listeners + Firebase Auth.

Scheduled jobs (Cloud Scheduler, provisioned in [infra/terraform/scheduler.tf](../infra/terraform/scheduler.tf)): briefing dispatch 06:15 IST → `agents.tasks.dispatch`; BQML train Sun 01:00; predict daily 02:00; consumption features 01:30; weather pull 04:00; IDSP weekly Mon 05:00; ELT hourly; KPI materialization hourly; monthly report 1st 03:00.
