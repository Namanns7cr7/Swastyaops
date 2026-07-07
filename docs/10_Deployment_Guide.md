# 10 — Deployment Guide

**Status:** Approved · **Owner:** Platform · **Last updated:** 2026-07-06
**Related:** [TRD](02_TRD.md) §13, §16 · [Security](13_Security.md) · IaC: [infra/terraform/](../infra/terraform/) · Pipelines: [.github/workflows/](../.github/workflows/), [infra/cloudbuild.yaml](../infra/cloudbuild.yaml)

Everything below is executed by CI for dev/staging/prod; the manual commands exist for bootstrap and break-glass. **Console changes in prod are forbidden** — Terraform is the source of truth ([TRD](02_TRD.md) §1).

---

## 1. Prerequisites

- Org-level: GCP Organization with billing; folder `swasthyaops`; Cloud Identity groups `gcp-swasthyaops-{admins,developers,operators}`.
- Local: `gcloud` ≥ 480, Terraform ≥ 1.8, Docker ≥ 26, Node 20, Python 3.12, Firebase CLI ≥ 13.
- Domains: `swasthyaops.in` delegated to Cloud DNS.

## 2. Bootstrap (once per environment)

```bash
export ENV=dev PROJECT=swasthyaops-$ENV REGION=asia-south1

# 2.1 Project + APIs
gcloud projects create $PROJECT --folder=$SWASTHYAOPS_FOLDER_ID
gcloud billing projects link $PROJECT --billing-account=$BILLING_ACCOUNT
gcloud services enable run.googleapis.com pubsub.googleapis.com firestore.googleapis.com \
  bigquery.googleapis.com aiplatform.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com cloudscheduler.googleapis.com \
  eventarc.googleapis.com apigateway.googleapis.com monitoring.googleapis.com \
  logging.googleapis.com cloudtrace.googleapis.com speech.googleapis.com \
  texttospeech.googleapis.com translate.googleapis.com firebase.googleapis.com \
  identitytoolkit.googleapis.com maps-backend.googleapis.com --project $PROJECT

# 2.2 Terraform state bucket (the only resource created outside Terraform)
gsutil mb -l $REGION -p $PROJECT gs://swasthyaops-$ENV-tf-state
gsutil versioning set on gs://swasthyaops-$ENV-tf-state

# 2.3 Firebase (Auth + Hosting attach)
firebase projects:addfirebase $PROJECT
```

## 3. Terraform layout

```
infra/terraform/
├── main.tf            # providers, backend, API enablement guard
├── variables.tf       # project_id, env, region, alert channels, domain
├── outputs.tf         # service URLs, topic names, dataset ids
├── pubsub.tf          # all topics + schemas + subscriptions + DLQs (registry: architecture/pubsub_topics.yaml)
├── cloudrun.tf        # 6 services (svc-api … svc-reports), ingress, scaling per TRD §2
├── firestore.tf       # database, composite indexes, TTL policies (schema doc §1.6–1.7)
├── bigquery.tf        # 4 datasets, tables, scheduled ELT queries, BQ subscription
├── storage.tf         # 4 buckets + lifecycle (TRD §6)
├── iam.tf             # per-service SAs + role bindings (Security §5)
├── secrets.tf         # Secret Manager entries (values set out-of-band, §6)
├── scheduler.tf       # briefing 06:15 IST, forecast train/predict, ingestion pulls, ELT
├── monitoring.tf      # dashboards, SLOs, alert policies (TRD §15)
├── network.tf         # LB, Cloud Armor, API Gateway, DNS, certs
└── artifact.tf        # Artifact Registry repo `services`
```

```bash
cd infra/terraform
terraform init -backend-config="bucket=swasthyaops-$ENV-tf-state"
terraform workspace select $ENV || terraform workspace new $ENV
terraform plan  -var="project_id=$PROJECT" -var="env=$ENV" -out=tfplan
terraform apply tfplan
```

First apply deploys Cloud Run services with the `placeholder-ok` bootstrap image; the first CI build replaces them.

## 4. Container build & deploy

Images: `asia-south1-docker.pkg.dev/$PROJECT/services/{svc-name}:git-{sha}` from the shared [backend/Dockerfile](../backend/Dockerfile) (arg `SERVICE` selects the entrypoint). Local build:

```bash
gcloud builds submit --config infra/cloudbuild.yaml \
  --substitutions=_ENV=dev,SHORT_SHA=$(git rev-parse --short HEAD)
```

[infra/cloudbuild.yaml](../infra/cloudbuild.yaml) stages: `pytest` → build images (parallel) → push → `terraform apply -target` image tag bump → smoke test (`/readyz` on every service) → (staging/prod) canary.

## 5. CI/CD flow (GitHub Actions ↔ Cloud Build)

| Trigger | Workflow | Result |
|---|---|---|
| PR | [.github/workflows/ci.yml](../.github/workflows/ci.yml) | ruff, mypy, pytest, eslint, tsc, vitest, `terraform validate`, tflint, prompt-eval smoke; Firebase Hosting preview channel |
| Merge `main` | [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) → Cloud Build (Workload Identity Federation — no SA keys in GitHub) | Deploy dev + smoke |
| Tag `v*` | same, env inputs | Staging → full e2e + load smoke → prod canary 10%/30 min → auto-promote or rollback ([TRD](02_TRD.md) §13) |

Manual rollback: `gcloud run services update-traffic svc-api --to-revisions=REV=100 --region=$REGION` (previous revisions retained 30 d); frontend `firebase hosting:rollback`.

## 6. Secrets

All in Secret Manager, mounted as env at deploy (never in images/repo/TF state — values set via `gcloud secrets versions add` by an operator):
`sms-gateway-key`, `sendgrid-key`, `maps-api-key` (server), `fcm-service-account`. Rotation quarterly, tracked in [Security](13_Security.md) §7. The frontend Maps key is a separate, HTTP-referrer-restricted key set at build time.

## 7. Firebase

```bash
cd frontend && npm run build
firebase deploy --project $PROJECT --only hosting,firestore:rules
```
Auth config (phone provider, email+password, MFA enforcement for admin roles, authorized domains) is scripted in [scripts/configure_firebase_auth.sh](../scripts/configure_firebase_auth.sh) via the Identity Toolkit Admin API. Firestore rules deploy from [infra/firestore.rules](../infra/firestore.rules) — same file CI-tests against the emulator ([Testing](12_Testing_Strategy.md) §5).

## 8. Post-deploy verification (every environment)

```bash
python scripts/smoke_test.py --project $PROJECT   # asserts:
# 1. /readyz green on all 6 services
# 2. publish test event → appears in swasthyaops_raw.events < 30 s
# 3. write test txn via API → Firestore doc + facility.inventory.updated observed
# 4. agent ping task → agent_runs doc with outcome=ok
# 5. briefing dry-run renders PDF + TTS to reports bucket
```
Then confirm Cloud Monitoring dashboard "SwasthyaOps Overview" shows all synthetic probes green.

## 9. Disaster recovery (NFR-10: RPO 1 h / RTO 4 h)

- **Firestore:** PITR (7 d) + daily managed export to `swasthyaops-$ENV-ingest/backups/firestore/`. Restore: import to new database, repoint via env var, replay Pub/Sub retained events since export.
- **BigQuery:** time travel (7 d) + nightly cross-region dataset copy to `asia-south2`.
- **Region loss (asia-south1):** run `terraform apply -var="region=asia-south2"` in the DR workspace (state is multi-region), restore Firestore export, re-run §8. Rehearsed quarterly; runbook results logged in ops journal.
- **Bad deploy:** canary auto-rollback; data migrations are expand-contract only (no destructive schema change within a release).

## 10. Cost guardrails

Budget: dev ₹8 k / staging ₹15 k / prod ₹40 k per month; alerts at 50/80/100% to `gcp-swasthyaops-operators`. Biggest levers already applied: scale-to-zero on 5 of 6 services, BigQuery partition filters mandatory, Gemini context caching ([AI Architecture](06_AI_Architecture.md) §6–7).
