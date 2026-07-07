# Event Catalog

Message contracts for every topic in [pubsub_topics.yaml](pubsub_topics.yaml). Proto schemas are attached to topics at provisioning ([infra/terraform/pubsub.tf](../infra/terraform/pubsub.tf)); Python types mirror them in [backend/app/models/events.py](../backend/app/models/events.py). Consumers must tolerate unknown *added* fields; removing/renaming fields is a breaking change requiring a new topic version (`.v2` suffix).

## Standard envelope (all topics)

```json
{
  "event_id": "018f3c1a-...",            // UUIDv7 — consumer dedup key (TRD §3)
  "event_type": "facility.inventory.updated",
  "occurred_at": "2026-07-06T04:31:12Z",
  "district_id": "sikar-raj",
  "facility_id": "phc-losal",            // optional on district-scoped events
  "actor": "user:uid_abc",               // user:{uid} | agent:{name} | system:{job}
  "trace_id": "projects/swasthyaops-prod/traces/4bf9...",
  "payload": { }                          // per-type, below
}
```
Pub/Sub attributes: `event_type`, `district_id`, `agent` (dispatch only — subscription filters key on it).

## Payloads

### `facility.inventory.updated`
```json
{ "txn_id": "txn_01J9X2", "item_code": "EDL-ORS-200", "item_name": "ORS Sachet 20.5g",
  "txn_type": "issue", "qty": -12, "balance_after": 118,
  "batch_no": "B2404", "source": "voice", "recorded_at": "2026-07-06T04:30:55Z" }
```

### `facility.footfall.recorded`
```json
{ "date": "2026-07-06", "delta": 112, "total_today": 112,
  "by_symptom": { "fever": 40, "diarrheal": 15, "respiratory": 8, "injury": 5, "anc": 12, "other": 32 },
  "source": "voice" }
```

### `facility.attendance.recorded`
```json
{ "date": "2026-07-06",
  "entries": [ { "staff_id": "stf_44", "role": "medical_officer", "status": "present" },
               { "staff_id": "stf_45", "role": "pharmacist", "status": "leave", "leave_type": "CL" } ] }
```

### `facility.beds.updated`
```json
{ "total": 30, "occupied": 26, "maintenance": 1,
  "by_ward": { "general": {"total": 20, "occupied": 18}, "maternity": {"total": 10, "occupied": 8} } }
```

### `facility.labs.updated`
```json
{ "test_code": "LAB-HB", "status": "reagent_out", "since": "2026-07-05T09:00:00Z", "reason": "Drabkin's reagent exhausted" }
```

### `alerts.*` (shared `alert.proto`)
```json
{ "alert_id": "alr_7c1", "type": "stockout_predicted", "severity": "high",
  "facility_ids": ["phc-losal"], "title": "ORS projected stock-out in 6 days",
  "evidence": [ { "kind": "forecast", "ref": "forecasts/phc-losal_EDL-ORS-200", "value": {"stockout_date": "2026-07-12"} } ],
  "source": "system:svc-forecast", "agent_run_id": null }
```
`alerts.outbreak.suspected` adds: `"confidence": 0.72, "disease_hypothesis": "acute diarrheal", "geo_uri": "gs://.../outbreak_7c1.geojson", "data_coverage": 0.91`.

### `agents.tasks.dispatch` (`agent_task.proto`)
```json
{ "task_id": "tsk_01J9Z", "plan_id": "pln_01J9Y", "agent": "inventory",
  "task_type": "verify_stockout", "trigger_event_id": "018f3c...",
  "depends_on": [], "deadline": "2026-07-06T05:00:00Z",
  "payload": { "alert_id": "alr_7c1", "facility_id": "phc-losal", "item_code": "EDL-ORS-200" } }
```

### `agents.runs.completed` (`agent_run_result.proto`)
```json
{ "run_id": "run_01J9...", "task_id": "tsk_01J9Z", "plan_id": "pln_01J9Y", "agent": "inventory",
  "outcome": "ok",                       // ok | degraded | failed | budget_exceeded
  "result_ref": "agent_runs/run_01J9...", // full transcript in Firestore
  "summary": { "verified": true, "donors": [{"facility_id": "chc-fatehpur", "surplus": 64, "travel_min": 22}] } }
```

### `recommendations.created` / `.approved` (`recommendation_event.proto`)
```json
{ "recommendation_id": "rec_9f2", "type": "stock_transfer", "alert_id": "alr_7c1",
  "status": "pending_approval",          // approved event: "approved" + approval block
  "actions_digest": "transfer 40x EDL-ORS-200 chc-fatehpur→phc-losal by 2026-07-10",
  "agent_run_id": "run_01JA0" }
```

### `notifications.outbound` (`notification_outbound.proto`)
```json
{ "notification_id": "ntf_3d8", "user_id": "uid_dho", "channel": "push",  // push|sms|email
  "severity": "high", "title": "Approval needed: ORS transfer to PHC Losal",
  "body": "Inventory Agent drafted a 40-unit transfer from CHC Fatehpur. Stock-out projected 12 Jul.",
  "deep_link": "/recommendations/rec_9f2", "quiet_hours_override": false,
  "digest_group": "stock_alerts" }
```

### `reports.requested` (`report_request.proto`)
```json
{ "report_id": "rpt_51a", "kind": "briefing",   // briefing|monthly|order_pdf|adhoc
  "formats": ["pdf", "tts"], "locales": ["en", "hi"],
  "content_ref": "briefings/sikar-raj_2026-07-06",  // composed content location
  "requested_by": "agent:executive_briefing" }
```

### `reports.generated` / `briefings.ready` / `forecasts.generated` / `ingest.*.loaded`
```json
{ "report_id": "rpt_51a", "artifacts": [{"format": "pdf", "uri": "gs://swasthyaops-prod-reports/..."}] }
{ "briefing_id": "sikar-raj_2026-07-06", "sections": 5, "pending_approvals": 2 }
{ "batch_id": "fc_2026-07-06", "series_count": 41910, "degraded_series": 312, "model_version": "m_consumption_arima@2026-07-05" }
{ "source": "idsp", "table": "swasthyaops_raw.idsp_weekly", "rows_loaded": 214, "load_meta_id": "ld_88" }
```
