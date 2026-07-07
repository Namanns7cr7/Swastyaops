# Backend

Python 3.12 / FastAPI / Pydantic v2. Six Cloud Run services from one codebase and one image ([Dockerfile](Dockerfile)); the `SERVICE` build arg selects the ASGI entrypoint. Service specs: [docs/02_TRD.md](../docs/02_TRD.md) §2.

```
app/
├── main.py                 # svc-api — public REST /v1 (docs/05_API_Specification.md)
├── core/
│   ├── config.py           # env settings (project, topics, model ids)
│   ├── auth.py             # Firebase JWT verification + claims scoping (@require_roles, tenancy guard)
│   ├── firestore.py        # client + transactional write-and-publish helper
│   ├── pubsub.py           # envelope builder + typed publishers (names from architecture/pubsub_topics.yaml)
│   └── errors.py           # AIP-193 error envelope (docs/05 §4)
├── models/
│   ├── schemas.py          # API request/response models (mirror docs/04 Firestore shapes)
│   └── events.py           # Pub/Sub envelope + payload types (mirror architecture/event_catalog.md)
├── routers/                # svc-api routers: facilities, inventory, alerts, recommendations, sync, admin, query
├── agents/
│   ├── main.py             # svc-agents — Pub/Sub push receiver, task envelope → Agent Engine run
│   ├── registry.py         # loads /prompts/*.md, registers Agent Engine apps, model config
│   └── tools/              # typed tool implementations (Pydantic I/O) — the ONLY data access agents have
├── ingestion/              # svc-ingestion — dataset parsers (docs/14_Data_Pipeline.md), GCS→BQ loads
├── forecast/               # svc-forecast — BQML train/predict orchestration, threshold engine
├── notify/                 # svc-notify — FCM/SMS/email transport, quiet hours enforcement
└── reports/                # svc-reports — WeasyPrint PDF, TTS assembly, GCS archival
tests/
├── unit/  component/  contract/  rules/  evals/    # docs/12_Testing_Strategy.md §1
```

## Run locally

```bash
pip install -e ".[dev]"
gcloud emulators firestore start --host-port=localhost:8686 &
export FIRESTORE_EMULATOR_HOST=localhost:8686 PUBSUB_EMULATOR_HOST=localhost:8085 \
       GOOGLE_CLOUD_PROJECT=swasthyaops-dev
uvicorn app.main:app --reload --port 8080
pytest              # emulator-first, no GCP project needed (docs/12 §2)
```

Invariants enforced here (from [docs/03_System_Architecture.md](../docs/03_System_Architecture.md) §1): services never call each other over HTTP; every Firestore mutation publishes its domain event via `firestore.write_and_publish`; agents touch data only through `app/agents/tools`.
