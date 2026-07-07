# 05 — API Specification

**Status:** Approved · **Owner:** Engineering · **Last updated:** 2026-07-06
**Related:** [TRD](02_TRD.md) §2 · [Database Schema](04_Database_Schema.md) · [Security](13_Security.md) §3–4 · [App Flow](08_App_Flow.md)
**Served by:** `svc-api` ([backend/app/](../backend/app/)) behind API Gateway · Base URL: `https://api.{env}.swasthyaops.in/v1`

OpenAPI 3.1 document is generated from FastAPI at `/v1/openapi.json` and must match this spec; drift fails CI ([Testing Strategy](12_Testing_Strategy.md) §4).

---

## 1. Conventions

- **Format:** JSON (`application/json; charset=utf-8`). Timestamps RFC 3339 UTC. IDs are opaque strings.
- **Versioning:** URL-versioned (`/v1`). Additive changes only within a version; breaking changes → `/v2` with 6-month overlap.
- **Pagination:** cursor-based — `?page_size=25&page_token=...`; responses carry `next_page_token` (empty = end).
- **Filtering:** documented per endpoint; unknown query params rejected with `400 INVALID_ARGUMENT`.
- **Tenancy:** every request is scoped by the caller's JWT claims (`district_ids`, `facility_ids`); path-level district/facility mismatch → `403 PERMISSION_DENIED` (never `404`, to avoid probing ambiguity — resource-not-found within scope is `404 NOT_FOUND`).
- **Localization:** `Accept-Language: hi` returns Hindi for server-composed text (alert titles, briefings); data fields untranslated.

## 2. Authentication

All endpoints require `Authorization: Bearer <Firebase ID token>` except `GET /v1/healthz`.

- Tokens issued by Firebase Authentication (phone OTP for facility roles, email+password+MFA for admin roles — [Security](13_Security.md) §3).
- Custom claims: `role`, `district_ids: string[]`, `facility_ids: string[]`. Claims set exclusively by the admin provisioning flow (`POST /v1/admin/users`).
- API Gateway validates signature/expiry; `svc-api` enforces authorization per the role matrix ([Security](13_Security.md) §4).
- Service-to-service: not applicable — services communicate via Pub/Sub only ([Architecture](03_System_Architecture.md) §1).

## 3. Rate limiting

| Scope | Limit | Enforced at |
|---|---|---|
| Per IP | 300 req/min | Cloud Armor |
| Per user (JWT `sub`) | 120 req/min sustained, burst 40 | API Gateway quota |
| `POST /v1/districts/{id}/query` (NL, Gemini-backed) | 10 req/min/user | svc-api token bucket (Firestore-backed, per instance soft) |
| PWA sync replay | 600 mutations/burst allowed via `Idempotency-Key` batch endpoint | svc-api |

Exceeded → `429 RESOURCE_EXHAUSTED` with `Retry-After` seconds.

## 4. Error model

Uniform envelope (Google AIP-193 style):

```json
{
  "error": {
    "code": 409,
    "status": "ABORTED",
    "message": "Stock level changed since validity snapshot; recommendation requires re-planning.",
    "details": [{ "reason": "STALE_VALIDITY_SNAPSHOT", "metadata": { "recommendation_id": "rec_9f2", "item_code": "EDL-ORS-200" } }],
    "trace_id": "projects/swasthyaops-prod/traces/4bf9..."
  }
}
```

| HTTP | `status` | When |
|---|---|---|
| 400 | `INVALID_ARGUMENT` | Validation failure (Pydantic detail in `details[]`) |
| 401 | `UNAUTHENTICATED` | Missing/expired token |
| 403 | `PERMISSION_DENIED` | Role or tenancy violation |
| 404 | `NOT_FOUND` | Resource absent within caller's scope |
| 409 | `ABORTED` / `ALREADY_EXISTS` | Concurrency conflict / duplicate idempotency key with different payload |
| 422 | `FAILED_PRECONDITION` | Valid shape, invalid state (e.g. approving an expired recommendation) |
| 429 | `RESOURCE_EXHAUSTED` | Rate limit |
| 500 | `INTERNAL` | Unhandled — always with `trace_id` |
| 503 | `UNAVAILABLE` | Dependency down (includes `Retry-After`); NL query path returns this during Gemini outage with `reason: AI_DEGRADED` |

## 5. Idempotency

All mutating endpoints accept `Idempotency-Key` (UUIDv7, required for PWA-originated writes). Keys stored 48 h in `processed_events`; replay with identical payload → original response (200/201 with `Idempotency-Replayed: true`); replay with different payload → `409 ALREADY_EXISTS`.

## 6. Resource surface

### 6.1 Districts & command center

| Method & path | Role(s) | Description |
|---|---|---|
| `GET /districts/{districtId}` | all | District doc incl. counters, health score |
| `GET /districts/{districtId}/summary` | all | Command-center tiles (from `mv_command_center_tiles` + live counters) |
| `GET /districts/{districtId}/facilities` | all | List; filters `type`, `status`, `min_score`, `max_score`, `block`; sort `health_score` |
| `GET /districts/{districtId}/kpis?from&to` | district_admin, dm, state_admin, viewer | PRD §4 KPI series |
| `POST /districts/{districtId}/query` | district_admin, dm, state_admin | NL ops query → Planner Agent (synchronous, ≤ 30 s, SSE stream) |

<details><summary><code>POST /districts/sikar-raj/query</code> — request/response example</summary>

```http
POST /v1/districts/sikar-raj/query
Authorization: Bearer eyJ...
Content-Type: application/json

{ "query": "Which PHCs will run out of ORS before the 15th?", "locale": "en" }
```

```json
{
  "answer": "3 facilities are projected to exhaust ORS before 2026-07-15: PHC Losal (T-6d), PHC Khandela (T-8d), CHC Ringas (T-9d). A transfer recommendation for PHC Losal is pending your approval (rec_9f2).",
  "citations": [
    { "kind": "forecast", "ref": "forecasts/phc-losal_EDL-ORS-200", "stockout_date": "2026-07-12" },
    { "kind": "recommendation", "ref": "recommendations/rec_9f2" }
  ],
  "agent_run_id": "run_01J9...",
  "confidence": "high"
}
```
</details>

### 6.2 Facility operations (FR-1)

| Method & path | Role(s) | Event published |
|---|---|---|
| `GET /facilities/{facilityId}` | all (scoped) | — |
| `GET /facilities/{facilityId}/inventory?risk_only=bool` | all (scoped) | — |
| `POST /facilities/{facilityId}/inventory/transactions` | pharmacist, facility_incharge | `facility.inventory.updated` |
| `POST /facilities/{facilityId}/footfall` | facility_incharge, pharmacist | `facility.footfall.recorded` |
| `PUT /facilities/{facilityId}/attendance/{date}` | facility_incharge | `facility.attendance.recorded` |
| `PUT /facilities/{facilityId}/beds` | facility_incharge | `facility.beds.updated` |
| `PUT /facilities/{facilityId}/labs/{testCode}` | facility_incharge, lab_tech | `facility.labs.updated` |
| `POST /facilities/{facilityId}/voice-entries` | facility roles | routes to STT + Gemini extraction, then the matching endpoint above |
| `POST /sync/batch` | facility roles | Replays PWA outbox: array of ≤ 200 mutations, each with `Idempotency-Key`; per-item status in response |

<details><summary><code>POST /facilities/phc-losal/inventory/transactions</code> — example</summary>

```http
POST /v1/facilities/phc-losal/inventory/transactions
Idempotency-Key: 018f3c1a-7b2e-7c3d-9e4f-5a6b7c8d9e0f

{
  "item_code": "EDL-ORS-200",
  "type": "issue",
  "qty": 12,
  "source": "voice",
  "recorded_at": "2026-07-06T04:31:12Z"
}
```

`201 Created`
```json
{
  "txn_id": "txn_01J9X2",
  "item_code": "EDL-ORS-200",
  "balance_after": 118,
  "predicted_stockout_date": "2026-07-12",
  "warning": "STOCK_RISK: below 14-day cover based on current burn rate"
}
```

Error — insufficient stock, `422`:
```json
{ "error": { "code": 422, "status": "FAILED_PRECONDITION",
  "message": "Issue of 12 exceeds current stock 4 for EDL-ORS-200.",
  "details": [{ "reason": "INSUFFICIENT_STOCK", "metadata": { "current_stock": "4" } }],
  "trace_id": "..." } }
```
</details>

<details><summary><code>POST /facilities/phc-losal/voice-entries</code> — example</summary>

```http
POST /v1/facilities/phc-losal/voice-entries
Content-Type: application/json

{ "audio_gcs_uri": null,
  "transcript": "आज ओपीडी एक सौ बारह, बुख़ार के चालीस, दस्त के पंद्रह",
  "language_code": "hi-IN", "entry_hint": "footfall" }
```

`200 OK`
```json
{
  "interpreted": { "kind": "footfall", "total": 112,
    "by_symptom": { "fever": 40, "diarrheal": 15 } },
  "confirmation_required": true,
  "confirmation_text_hi": "ओपीडी 112, बुख़ार 40, दस्त 15 — सही है?",
  "draft_id": "vd_01J9Y"
}
```
Client confirms with `POST /voice-entries/{draft_id}:confirm` → the footfall record is written and `facility.footfall.recorded` published. Low-confidence extraction (< 0.8) returns `interpreted: null` with `clarification_prompt`.
</details>

### 6.3 Alerts & recommendations (FR-2)

| Method & path | Role(s) | Notes |
|---|---|---|
| `GET /districts/{id}/alerts?status&type&severity` | all | Inbox, composite-indexed |
| `POST /alerts/{alertId}:acknowledge` \| `:resolve` \| `:dismiss` | district_admin, dm | Body: `{ "note": "..." }`; appends `status_history`, audit-logged |
| `GET /districts/{id}/recommendations?status` | district_admin, dm, state_admin | Approval queue |
| `GET /recommendations/{recId}` | same | Full detail incl. `evidence`, `validity_snapshot`, `agent_run_id` |
| `POST /recommendations/{recId}:approve` | district_admin, dm | Optional `edits` (JSON Patch on `actions`); re-validates snapshot — stale → `409 ABORTED / STALE_VALIDITY_SNAPSHOT`, agent re-plans automatically |
| `POST /recommendations/{recId}:reject` | district_admin, dm | Requires `rejection_reason` (feeds agent eval set, [AI Architecture](06_AI_Architecture.md) §8) |

<details><summary><code>POST /recommendations/rec_9f2:approve</code> — example</summary>

```http
POST /v1/recommendations/rec_9f2:approve

{ "edits": [ { "op": "replace", "path": "/actions/0/qty", "value": 30 } ] }
```

`200 OK`
```json
{
  "id": "rec_9f2", "status": "approved",
  "approval": { "by": "user:dho-sikar", "at": "2026-07-06T03:05:44Z",
                "edits": [{ "op": "replace", "path": "/actions/0/qty", "value": 30 }] },
  "order_pdf": { "status": "generating", "will_notify": true },
  "notified_facilities": ["chc-fatehpur", "phc-losal"]
}
```
</details>

### 6.4 Briefings, reports, notifications (FR-4)

| Method & path | Role(s) |
|---|---|
| `GET /districts/{id}/briefings/latest` · `GET /briefings/{briefingId}` | district_admin, dm, state_admin |
| `GET /districts/{id}/reports?type&period` · `POST /districts/{id}/reports` (ad-hoc request) | same |
| `GET /reports/{reportId}/download` → 302 to signed GCS URL (15-min expiry) | same |
| `GET /me/notifications?status` · `POST /notifications/{id}:read` | all |
| `GET /me` · `PATCH /me/preferences` (locale, channels, quiet hours) | all |

### 6.5 Administration (FR-5)

| Method & path | Role(s) |
|---|---|
| `POST /admin/users` · `PATCH /admin/users/{uid}` · `POST /admin/users/{uid}:deactivate` | district_admin (own district), state_admin |
| `POST /admin/facilities` (onboarding from directory) · `PATCH /admin/facilities/{id}` | district_admin, state_admin |
| `GET /admin/audit-logs?actor&resource&from&to` | district_admin, state_admin |
| `GET /admin/agents/runs?agent&outcome` · `GET /admin/agents/health` | state_admin, system ops |

### 6.6 System

| Method & path | Auth |
|---|---|
| `GET /healthz` (liveness) · `GET /readyz` (deps check) | none / internal |
| `GET /v1/openapi.json` | authenticated |

## 7. Webhooks / push (internal)

Pub/Sub push endpoints (`/internal/pubsub/*` on each service) are **not** part of this public surface; they validate the Pub/Sub OIDC token audience and are internal-ingress only ([TRD](02_TRD.md) §12). Contracts in [architecture/event_catalog.md](../architecture/event_catalog.md).
