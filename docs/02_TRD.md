# 02 — Technical Requirements Document (TRD)

**Status:** Approved · **Owner:** Engineering · **Last updated:** 2026-07-06
**Related:** [PRD](01_PRD.md) · [System Architecture](03_System_Architecture.md) · [Database Schema](04_Database_Schema.md) · [API Spec](05_API_Specification.md) · [Deployment Guide](10_Deployment_Guide.md) · [Security](13_Security.md)

Implements the functional requirements FR-1…FR-5 and NFR-1…NFR-11 defined in the [PRD](01_PRD.md) §5–6.

---

## 1. Platform decisions (normative)

| Decision | Choice | Rationale / ADR |
|---|---|---|
| Compute | **Cloud Run** (gen2) for all services; no GKE, no VMs | Stateless mandate, scale-to-zero for cost, per-district isolation later via traffic tags |
| Messaging | **Pub/Sub** for all inter-service communication | [ADR-0001](../architecture/adr/0001-pubsub-over-kafka.md) — vs Kafka: no cluster ops, per-message pricing fits bursty district load, native Eventarc/Cloud Run push, DLQ built-in |
| Serving store | **Firestore** (Native mode) | Offline SDK for PWA (NFR-4), realtime listeners for command center, security rules for row-level access |
| Analytics store | **BigQuery** | ML in-warehouse (BQML), public-dataset joins, per-TB pricing |
| AI runtime | **Vertex AI Agent Engine** + Gemini API | Managed sessions/memory, tool-calling loop, [AI Architecture](06_AI_Architecture.md) |
| IaC | **Terraform** exclusively; console changes forbidden in prod | [infra/terraform](../infra/terraform/) |
| Identity | **Firebase Authentication** (phone OTP + email) with custom claims | [Security](13_Security.md) §3 |
| Region | `asia-south1`; DR `asia-south2` | NFR-6 data residency |

## 2. Microservice catalog

All services: Python 3.12, FastAPI, Pydantic v2, structured JSON logs, OpenTelemetry traces. Container spec in [backend/Dockerfile](../backend/Dockerfile); full endpoint surface in [API Spec](05_API_Specification.md).

| Service | Responsibility | Trigger | Scale (min/max) | CPU/RAM | Concurrency |
|---|---|---|---|---|---|
| `svc-api` | Public REST API `/v1`, auth enforcement, Firestore reads/writes, publishes domain events | HTTPS (API Gateway → Cloud Run) | 1 / 20 | 1 vCPU / 512 Mi | 80 |
| `svc-ingestion` | Public-dataset ingestion (HMIS, NFHS, RHS, IDSP, weather, population); GCS → BigQuery loads; normalization | Cloud Scheduler + Eventarc (GCS finalize) | 0 / 5 | 1 vCPU / 1 Gi | 10 |
| `svc-agents` | Hosts agent runtime: receives task envelopes, runs Vertex AI Agent Engine sessions, executes tools, writes `agent_runs` | Pub/Sub push (`agents.tasks.dispatch`) | 0 / 10 | 2 vCPU / 2 Gi | 4 |
| `svc-forecast` | Orchestrates BQML training + batch prediction; materializes forecasts to Firestore | Cloud Scheduler (weekly train, daily predict) | 0 / 3 | 1 vCPU / 1 Gi | 1 |
| `svc-notify` | Channel fan-out: FCM push, SMS (DLT-registered gateway), SendGrid email; quiet hours; delivery receipts | Pub/Sub push (`notifications.outbound`) | 0 / 10 | 0.5 vCPU / 256 Mi | 40 |
| `svc-reports` | PDF rendering (WeasyPrint), report/briefing assembly, Cloud Storage archival, signed URLs | Pub/Sub push (`reports.requested`) | 0 / 5 | 2 vCPU / 2 Gi | 2 |

**Statelessness rule:** no service holds state between requests. Session-ish state lives in Firestore (`agent_runs`, `users.preferences`) or Vertex AI Agent Engine managed sessions. In-memory caches are allowed only as read-through with TTL ≤ 60 s (see §10).

## 3. Pub/Sub

Authoritative topic registry: [architecture/pubsub_topics.yaml](../architecture/pubsub_topics.yaml). Message contracts: [architecture/event_catalog.md](../architecture/event_catalog.md).

Requirements:
- **Schema enforcement:** every topic has a Pub/Sub schema (Protocol Buffer) attached; publishes failing validation are rejected at the client.
- **Envelope:** every message carries `event_id` (UUIDv7), `event_type`, `occurred_at`, `district_id`, `facility_id?`, `actor` (`user:{uid}` | `agent:{name}` | `system:{job}`), `trace_id`, `payload`.
- **Ordering:** ordering keys = `facility_id` on `facility.*` topics (per-facility total order); unordered elsewhere.
- **Delivery:** push subscriptions to Cloud Run with OIDC auth (subscription SA must match expected audience); exactly-once not assumed — **all consumers idempotent** on `event_id` (dedup table `swasthyaops_curated.processed_events`, Firestore transaction guards).
- **DLQ:** every subscription has `{topic}.dlq` after 5 delivery attempts; DLQ depth > 0 for 10 min pages on-call (§11).
- **Retention:** 7 days topic retention; DLQ 14 days.

## 4. Firestore

Full schema, indexes, TTL policies, and security rules in [Database Schema](04_Database_Schema.md). TRD constraints:
- Native mode, `asia-south1`, PITR enabled (7 days) → NFR-10 RPO.
- All client access mediated by security rules keyed on custom claims (`role`, `district_ids`, `facility_ids`); services use dedicated SAs, never the client SDK path.
- Composite indexes are declared in [infra/terraform/firestore.tf](../infra/terraform/firestore.tf) — never created ad-hoc from error-message links in prod.
- Document size discipline: time-series data (footfall history, stock ledger) goes to subcollection documents per day/transaction, never arrays on the parent.

## 5. BigQuery

Datasets `swasthyaops_raw` (landing, source-shaped), `swasthyaops_curated` (typed, deduped, partitioned), `swasthyaops_ml` (features, models, predictions), `swasthyaops_analytics` (serving views for reports/KPIs). Schemas, partitioning, and clustering in [Database Schema](04_Database_Schema.md) §3; pipelines in [Data Pipeline](14_Data_Pipeline.md).
- Streaming path: Pub/Sub → BigQuery subscription (no Dataflow at pilot scale) into `swasthyaops_raw.events`; ELT via scheduled queries (hourly) into curated tables.
- All curated tables partitioned on event date, clustered on `(district_id, facility_id)`; `require_partition_filter = true`.
- Cost guardrail: `maximum_bytes_billed` = 10 GB on all scheduled queries; per-user custom quota 1 TB/day.

## 6. Cloud Storage

| Bucket | Content | Lifecycle |
|---|---|---|
| `swasthyaops-{env}-ingest` | Raw dataset drops (CSV/XLS/PDF from HMIS, IDSP, RHS) | Nearline @ 30 d, delete @ 365 d |
| `swasthyaops-{env}-reports` | Generated PDFs, briefing audio (MP3) | Nearline @ 90 d, Coldline @ 365 d |
| `swasthyaops-{env}-models` | Prompt bundles, eval datasets, exported artifacts | Versioned, no expiry |
| `swasthyaops-{env}-tf-state` | Terraform state | Versioned, locked |

All buckets: uniform bucket-level access, CMEK not required at pilot (Google-managed encryption satisfies NFR-6), public access prevention enforced.

## 7. IAM

Principle: one service account per service, least privilege, no keys (Workload Identity / ambient credentials only). Full role matrix in [Security](13_Security.md) §5; provisioned in [infra/terraform/iam.tf](../infra/terraform/iam.tf). Summary:

| SA | Key roles |
|---|---|
| `sa-svc-api` | `datastore.user`, `pubsub.publisher` (domain topics only), `aiplatform.user` (NL query path) |
| `sa-svc-ingestion` | `bigquery.dataEditor` (raw), `storage.objectViewer` (ingest bucket), `pubsub.publisher` (ingest topics) |
| `sa-svc-agents` | `aiplatform.user`, `datastore.user`, `bigquery.dataViewer` (curated/ml), `pubsub.publisher` (alerts/recommendations/notifications) |
| `sa-svc-forecast` | `bigquery.jobUser` + `dataEditor` (ml), `datastore.user` |
| `sa-svc-notify` | `datastore.viewer`, Secret Manager accessor (SMS/email creds) |
| `sa-svc-reports` | `storage.objectAdmin` (reports bucket), `datastore.viewer`, `bigquery.dataViewer` (analytics) |
| `sa-deploy` (Cloud Build) | `run.admin`, `iam.serviceAccountUser` (scoped), `artifactregistry.writer` |

## 8. Scaling model

- Pilot load: 110 facilities × ~40 events/day ≈ 4.4 k events/day; command center ~500 concurrent users at morning peak. Trivial for the stack; the design target is **50 districts** (≈ 250 k events/day, 25 k users) with **zero architectural change** — only max-instance and quota bumps.
- Cloud Run autoscaling on concurrency; `svc-api` keeps `min_instances=1` to kill cold-start latency for the 07:00 briefing spike.
- Firestore hot-spot avoidance: document IDs are UUIDs (never sequential), per-facility ordering keys shard Pub/Sub naturally.
- BigQuery: pilot fits on-demand pricing; move to editions reservation at ≥ 10 districts.

## 9. Availability & SLOs

| SLO | Target | SLI source |
|---|---|---|
| `svc-api` availability | 99.5% | Cloud Monitoring uptime check + LB 5xx ratio |
| Read latency P95 | < 800 ms | Cloud Run request latencies |
| Event → dashboard freshness | < 15 s P95 | Synthetic probe (Cloud Scheduler → write → measure listener) |
| Briefing delivery by 07:15 IST | 99% of days | `briefings` collection timestamp audit |

Error budget policy: SLO burn > 2× for 1 h pages on-call; > 10% monthly budget consumed halts feature deploys (CI gate reads Cloud Monitoring).

## 10. Caching

| Layer | What | TTL | Invalidation |
|---|---|---|---|
| CDN (Firebase Hosting) | Static assets, immutable bundles | 1 y (hashed filenames) | Deploy |
| `svc-api` in-memory (per instance) | Medicine catalog, facility directory, config docs | 60 s | TTL only (config changes tolerate 60 s lag) |
| Firestore client (PWA) | Full offline mirror of user-scoped data | Persistent | SDK sync |
| Gemini context cache | Agent system prompts + tool schemas + district context block | 1 h refresh | Prompt version bump ([AI Architecture](06_AI_Architecture.md) §6) |
| BigQuery | Materialized views for KPI tiles | Auto | Scheduled refresh 1 h |

No Redis/Memorystore at pilot — the above layers cover every read path; introducing shared cache state would violate the statelessness rule for marginal gain. Revisit at ≥ 10 districts.

## 11. Retry policies

| Path | Policy |
|---|---|
| Pub/Sub push → Cloud Run | Exponential backoff 10 s → 600 s, DLQ after 5 attempts |
| Service → Gemini / Vertex AI | 3 retries, jittered backoff (1/2/4 s), then fallback chain ([AI Architecture](06_AI_Architecture.md) §5); circuit breaker opens after 10 consecutive failures per instance, half-open probe every 30 s |
| Service → Firestore/BigQuery | Client-lib default retries (idempotent ops only); transactions retried ≤ 5× |
| `svc-notify` → SMS/email gateways | 3 retries then park in `notifications` with `status=failed`; hourly re-drive job; critical severity falls back SMS→push→email in order |
| Frontend → API | Retry idempotent GETs ×2; mutations queued in PWA outbox, replayed with `Idempotency-Key` ([API Spec](05_API_Specification.md) §5) |

## 12. Networking

- Public ingress only via Global External HTTPS LB → API Gateway → `svc-api`; all other services `ingress=internal` (Pub/Sub push arrives via OIDC-authenticated internal ingress).
- Egress: `svc-notify` and `svc-ingestion` need internet egress (SMS gateway, data portals); others restricted.
- Cloud Armor on the LB: OWASP preconfigured rules, per-IP rate limit 300 req/min, geo-allowlist IN (+ configured exceptions for state NIC ranges).
- Custom domains: `api.{env}.swasthyaops.in`, `app.{env}.swasthyaops.in` (Firebase Hosting), managed certs.
- No VPC connector needed at pilot (no private RFC1918 dependencies); DNS + domains in Terraform.

## 13. CI/CD

Pipeline definitions: [.github/workflows](../.github/workflows/), [infra/cloudbuild.yaml](../infra/cloudbuild.yaml). Flow (detail in [Deployment Guide](10_Deployment_Guide.md)):
1. **PR:** GitHub Actions — ruff + mypy + pytest (backend), eslint + tsc + vitest (frontend), `terraform validate` + `tflint`, prompt eval smoke suite. Merge blocked on red.
2. **Merge to `main`:** Cloud Build trigger — build images → Artifact Registry (`asia-south1-docker.pkg.dev/swasthyaops-{env}/services/*`, tagged `git-{sha}`), deploy to **dev**, run smoke tests.
3. **Release tag `v*`:** deploy to **staging**, run full e2e + load smoke, then **prod** with canary: 10% traffic 30 min → auto-promote if error rate < 0.5% and P95 within SLO, else auto-rollback (`gcloud run services update-traffic`).
4. Firebase Hosting: preview channel per PR; live channel on release.

## 14. Security & compliance (summary — normative detail in [Security](13_Security.md))

Firebase Auth with MFA for admin roles; JWT custom claims authz at API and Firestore rules; Secret Manager for all credentials (no env-var secrets); DPDP Act 2023 alignment — no patient PII ingested at pilot (aggregate counts only); audit log immutable (`audit_logs` + BigQuery sink); quarterly access review; container base images distroless, scanned by Artifact Analysis, deploy blocked on critical CVEs.

## 15. Monitoring & observability

- **Logging:** structured JSON to Cloud Logging; `trace_id` propagated from LB through Pub/Sub envelope to agent runs — one query reconstructs any event's full path. Log-based metrics for business events (approvals, alert volumes).
- **Tracing:** OpenTelemetry → Cloud Trace, 10% sampling (100% on `/v1/agents/*` paths).
- **Metrics & dashboards:** per-service Cloud Monitoring dashboards (defined in [infra/terraform/monitoring.tf](../infra/terraform/monitoring.tf)): request rates, latencies, Pub/Sub backlog & DLQ depth, Gemini token spend/day, BQML job status.
- **Alerting policies:** SLO burn, DLQ non-empty 10 min, ingestion job missed (Scheduler failure), Gemini error ratio > 5%, daily token spend > budget line, briefing not generated by 07:15 IST.
- **Error tracking:** Cloud Error Reporting with per-service notification channels.

## 16. Environments

| Env | Project | Data | Deploy |
|---|---|---|---|
| dev | `swasthyaops-dev` | Synthetic seed ([scripts/seed_firestore.py](../scripts/seed_firestore.py)) | Every merge |
| staging | `swasthyaops-staging` | Anonymized pilot-shaped dataset | Release tags |
| prod | `swasthyaops-prod` | Pilot district live data | Canary after staging green |

Terraform workspaces map 1:1 to environments; a single [infra/terraform](../infra/terraform/) root with `-var env=`.
