# 08 — App Flow

**Status:** Approved · **Owner:** Product + Design · **Last updated:** 2026-07-06
**Related:** [PRD](01_PRD.md) §3 (personas) · [UI/UX Guidelines](09_UI_UX_Guidelines.md) (visual system) · [API Spec](05_API_Specification.md) (every screen maps to endpoints) · Design exports: [stitch_screens/](../stitch_screens/)
**Frontends:** Command Center web ([frontend/](../frontend/)) · Facility PWA ([mobile/](../mobile/)) — one Next.js codebase, role-routed.

Breakpoints (see [UI/UX](09_UI_UX_Guidelines.md) §4): **Desktop** ≥ 1240 px (permanent nav rail + 12-col grid) · **Tablet** 600–1239 px (collapsible rail, 8-col) · **Mobile** < 600 px (bottom nav bar, 4-col, thumb-zone actions).

---

## 1. Navigation model by role

| Role | Landing screen | Primary nav items |
|---|---|---|
| `district_admin` (DHO), `dm` | S2 Command Center | Command Center · Alerts · Approvals · Facilities · Briefings · Reports |
| `state_admin` | S12 District comparison | Districts · Reports · Admin |
| `facility_incharge` | S8 Facility Home | Home · Entry (Stock/OPD/Attendance/Beds/Labs) · Requests · Alerts |
| `pharmacist` | S9 Stock screen | Stock · Receipts · Transfers · Alerts |
| `lab_tech` | S10 Labs screen | Labs · Alerts |
| `viewer` | S2 (read-only, approval actions hidden) | Command Center · Facilities · Reports |

Role gating is claim-driven (JWT custom claims) at route level; server enforces regardless ([Security](13_Security.md) §4).

## 2. Screen inventory

| # | Screen | Roles | Key API calls |
|---|---|---|---|
| S1 | Sign-in (phone OTP / email+MFA) + district/facility picker | all | Firebase Auth, `GET /me` |
| S2 | **Command Center** — KPI tiles, live district map, alert stream | admin/viewer | `GET /districts/{id}/summary`, `/alerts`, Firestore listeners |
| S3 | Alert Inbox — filter/sort, bulk acknowledge | admin | `GET /districts/{id}/alerts`, `:acknowledge` |
| S4 | Alert Detail — evidence panel, linked forecast chart, agent provenance, actions | admin | `GET /alerts/{id}`, `GET /recommendations/{id}` |
| S5 | Approval Queue — recommendation cards with approve/edit/reject | district_admin, dm | `GET /districts/{id}/recommendations?status=pending_approval` |
| S6 | Recommendation Detail — actions table (editable qty/date), validity snapshot, rationale with citations, generated-order preview | district_admin, dm | `:approve`, `:reject` |
| S7 | Facility Directory + Facility 360 — 90-day trend tabs (stock/footfall/attendance/beds/labs), vs-district-median overlay | all | `GET /facilities/{id}/*` |
| S8 | Facility Home (PWA) — today's checklist (footfall ✓, attendance ✓, stock pending), sync status, facility alerts | facility roles | `GET /facilities/{id}`, outbox state |
| S9 | Stock Entry — search/scan item, +receipt/−issue, batch & expiry, voice button | pharmacist, incharge | `POST .../inventory/transactions` |
| S10 | Labs & Beds status boards — tap-to-toggle statuses | lab_tech, incharge | `PUT .../labs/{code}`, `PUT .../beds` |
| S11 | OPD Footfall entry — steppers per symptom category, voice-first | incharge, pharmacist | `POST .../footfall` |
| S12 | Briefing view — text (EN/HI toggle), audio player, "jump to approval" deep links | dm, admin | `GET /briefings/{id}` |
| S13 | Reports library + viewer | admin, state | `GET /reports`, `/download` |
| S14 | Ask SwasthyaOps — NL query chat with streamed answer + citation chips | admin, dm | `POST /districts/{id}/query` (SSE) |
| S15 | Admin — users, facility onboarding wizard, audit log, agent health | district_admin, state_admin | `/admin/*` |
| S16 | Settings — language, notification channels, quiet hours, offline storage usage | all | `PATCH /me/preferences` |

Stitch design references: S2 mobile = [stitch_screens/01_ai_command_center_mobile.html](../stitch_screens/01_ai_command_center_mobile.html); tokens in [stitch_screens/design_swasthyaops_ai_light.md](../stitch_screens/design_swasthyaops_ai_light.md) (light) and [design_enterprise_precision_dark.md](../stitch_screens/design_enterprise_precision_dark.md) (dark).

## 3. Command Center flow (DHO, desktop — primary persona P1)

```
S1 sign-in (email + MFA)
 └─ S2 Command Center
     ├─ Row 1: KPI tiles — Open criticals · Stock-risk facilities · Doctors present % ·
     │         Beds available · Labs down · Facilities reporting today
     ├─ Row 2 left (8 col): Google Map, facility markers colored by health_score
     │         quintile; click → S7 drawer. Layers: alerts, outbreak GeoJSON, stock risk
     ├─ Row 2 right (4 col): live Alert Stream (Firestore listener) — newest first,
     │         severity chips; click → S4
     └─ Header: pending-approvals badge → S5; Ask box → S14; briefing chip → S12

S4 Alert Detail (e.g. stockout_predicted, PHC Losal, ORS)
 ├─ Evidence: forecast fan chart (P10/P50/P90) + current stock line; ledger tail; agent run link
 ├─ Status actions: Acknowledge / Resolve / Dismiss (note required for dismiss)
 └─ Linked recommendation card → S6
      ├─ Actions table: 40× ORS, CHC Fatehpur → PHC Losal, by 2026-07-10 [qty/date editable]
      ├─ Rationale with citation chips (each opens the underlying data)
      ├─ Validity snapshot age indicator (re-validated on approve; stale → inline re-plan notice)
      └─ [Reject with reason] [Edit & Approve] [Approve] → toast + order PDF ready → both facilities notified
```

Tablet (field visits): identical layout collapsed to 8-col; map and alert stream stack; approval actions remain one tap from S2. Mobile: S2 becomes tile list + map thumbnail; S5/S6 fully usable — approving from a phone is a first-class path (DMs live on phones, persona P4).

## 4. Facility flow (pharmacist, mobile PWA — persona P3)

```
S1 sign-in (phone OTP, remembered 30 d) → S9 Stock
 ├─ Top: sync chip (green synced / amber N queued / grey offline)
 ├─ "Needs attention" strip: items below reorder, expiring < 90 d, incoming transfers
 ├─ Search or scan barcode → item card → [− Issue] [+ Receipt] [Adjust]
 │    stepper + batch picker → Save → optimistic UI + outbox enqueue
 │    server warning surfaced on sync (e.g. STOCK_RISK from API §6.2)
 └─ 🎤 Voice: hold-to-talk → "पैरासिटामोल पचास टैबलेट इशू" → STT → Gemini extraction
      → confirmation sheet (HI): "पैरासिटामोल 500mg — 50 टैबलेट इशू — सही है?" [✓ हाँ] [✗ बदलें]
      → confirmed → same outbox path. Low confidence → clarification prompt (§6)
```

Incoming transfer flow: push notification "40× ORS arriving from CHC Fatehpur (order #...)" → S9 Transfers tab → [Received in full] / [Received partial: qty] → creates `transfer_in` ledger txn → district sees execution status on S6.

## 5. Daily briefing flow (DM, mobile — persona P4)

07:00 push: "Sikar briefing: 2 decisions pending, 1 new critical." → S12: audio player (HI default per locale), 90-sec TTS; text sections with citation chips; "2 approvals waiting" card deep-links to S6. One-tap approve with biometric confirm (WebAuthn step-up, [Security](13_Security.md) §3). Offline on the highway: yesterday's briefing cached, banner shows staleness.

## 6. Voice interaction spec

- **Where:** S9 stock, S11 footfall, S10 status boards (`hi-IN` primary, `en-IN` fallback; code-switching supported by STT v2).
- **Contract:** hold-to-talk (no wake word) → live transcript → structured extraction (Gemini Flash, `response_schema`) → **always a visual+spoken confirmation before any write** → TTS confirmation of the saved record.
- **Confidence gates:** ≥ 0.8 → confirmation sheet; 0.5–0.8 → clarification ("कौन सी दवा — पैरासिटामोल 500 या 650?"); < 0.5 → "समझ नहीं आया" + form fallback pre-filled with recognized fragments.
- **Offline:** voice requires connectivity (STT is cloud); offline taps the mic → toast "आवाज़ एंट्री के लिए इंटरनेट चाहिए" + form path. Eval target: AC-A2 ≥ 90% on the 200-utterance golden set ([Testing](12_Testing_Strategy.md) §7).

## 7. Offline model (PWA — NFR-4: 72 h)

### 7.1 Reads
Firestore SDK offline persistence mirrors the user's scoped data (own facility docs + subcollections + open alerts). Every screen renders from cache instantly; staleness chip shows `last synced HH:MM`.

### 7.2 Writes — the outbox
All mutations go to an IndexedDB outbox (never direct Firestore writes — [Database Schema](04_Database_Schema.md) §1.8): `{idempotency_key (UUIDv7), endpoint, payload, recorded_at, status}`. Optimistic local apply immediately. On connectivity (Background Sync API + foreground trigger): replay via `POST /v1/sync/batch` in recorded order; per-item results update the outbox; server warnings (e.g. `INSUFFICIENT_STOCK` on an offline-recorded issue) surface as a review list, not silent failure.

### 7.3 Conflicts
Server applies field-level last-write-wins by `recorded_at` (client clock, sanity-checked ±24 h — PRD §9). Ledger transactions never conflict (append-only). Divergence > 10% between resulting stock level and any concurrent physical count triggers a reconciliation task on S8 for the in-charge. Both raw entries are always preserved in the ledger.

### 7.4 Command center offline
Web app caches last snapshot (map tiles, tiles, alert list read-only); banner "Offline — data as of 06:42"; approvals disabled offline (legal-order integrity requires live validity re-check, S6).

## 8. Empty, loading, error states (every screen)

- **Loading:** skeletons matching final layout (no spinners on primary surfaces); map shows facility markers progressively.
- **Empty:** instructive, role-aware ("No open alerts — last critical resolved 2 d ago", not blank).
- **Error:** inline retry with `trace_id` in a collapsible detail; degraded-AI banner when `503 AI_DEGRADED` ([AI Architecture](06_AI_Architecture.md) §5) — deterministic features stay available and say so.
- **Stale facility:** badge on S2 map + S7 ("No reports for 3 days") — visually distinct from "healthy" per PRD §9.

## 9. First-run & onboarding

- Facility user first sign-in: 3-card walkthrough (your checklist / voice entry demo with sample utterance / sync explained), in locale; skippable, revisitable from S16.
- District onboarding (S15 wizard): import facilities from Health Centre Directory by LGD code → verify geo-pins on map (drag to correct) → assign in-charge phone numbers → bulk OTP invite. Target: district live in < 1 day ([Roadmap](16_Future_Roadmap.md) scale-out).
