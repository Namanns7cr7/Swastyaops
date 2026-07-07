# 01 — Product Requirements Document (PRD)

**Product:** SwasthyaOps AI — AI Operating System for District Healthcare
**Status:** Approved for build · **Owner:** Product · **Last updated:** 2026-07-06
**Related:** [TRD](02_TRD.md) · [System Architecture](03_System_Architecture.md) · [Agent Design](07_Agent_Design.md) · [App Flow](08_App_Flow.md) · [Implementation Plan](11_Implementation_Plan.md)

---

## 1. Vision

Every District Health Officer in India should start their day knowing exactly which of their facilities will fail this week — and have the intervention already drafted. SwasthyaOps AI is the operational nervous system for district healthcare: it senses facility state in real time, forecasts failures before they happen, and converts insight into executable government action (transfer orders, indents, staffing directives) with a human always approving the final step.

We are not building a reporting tool. HMIS already collects data; it arrives monthly, aggregated, and too late. We are building the **command center** — the layer between data and decision that currently exists only as phone calls and paper.

## 2. Objectives (12-month pilot horizon)

| # | Objective | Key Result |
|---|---|---|
| O1 | Eliminate surprise stock-outs of essential medicines | ≥ 80% of stock-outs predicted ≥ 14 days ahead; district-wide stock-out days reduced 50% |
| O2 | Make facility staffing visible and accountable | Doctor absence flagged within 24h; unexplained absence rate reduced 30% |
| O3 | Cut district reaction time from weeks to hours | Median time from anomaly → approved intervention < 8 working hours |
| O4 | Detect disease outbreaks earlier than IDSP weekly cycle | ≥ 7 days earlier detection for diarrheal/vector-borne clusters in pilot district |
| O5 | Give the DM/DHO a daily decision-ready briefing | ≥ 85% of briefing recommendations rated actionable by DHO (weekly survey) |

## 3. Personas

### P1 — Dr. Meena Sharma, District Health Officer (primary)
- **Context:** Oversees 110+ facilities, reports to District Magistrate and State NHM. Reviews paper reports, spends 3–4 h/day on calls chasing status.
- **Needs:** One screen answering "what will break this week and what do I sign to prevent it."
- **Success:** Opens the Command Center each morning, approves/edits AI-drafted interventions, spends recovered time on field visits.
- **Devices:** Desktop in office, Android tablet in field. Comfortable in Hindi and English.

### P2 — Dr. Arjun Verma, Medical Officer In-Charge, PHC Losal (primary)
- **Context:** Runs a 6-bed PHC with 1 pharmacist, 2 ANMs. 80–120 OPD patients/day. Paper stock registers, monthly HMIS upload via CHC.
- **Needs:** Data entry that takes seconds not hours; early warning when his indent will be short; visibility that his requests reached the district.
- **Success:** Uses voice entry ("आज ओपीडी एक सौ बारह, बुख़ार के चालीस") between patients; stock counts auto-reconciled.
- **Devices:** Personal Android phone, intermittent 4G. **Offline-first is non-negotiable.**

### P3 — Sunita Devi, Pharmacist, CHC Fatehpur
- **Needs:** Scan/enter stock receipts and issues in < 30 s; see incoming transfers; low-stock list ordered by urgency.
- **Devices:** Shared desktop + Android phone.

### P4 — Shri Rakesh Gupta IAS, District Magistrate (secondary)
- **Needs:** 90-second daily briefing (text + audio), exception escalations only, monthly PDF for state review meetings.
- **Devices:** Phone. Will not open dashboards; consumes briefings via app notification and email.

### P5 — State NHM Program Officer (secondary)
- **Needs:** Cross-district comparison, data export to state HMIS cell, audit trail of interventions.

### P6 — System Administrator, District NIC cell (supporting)
- **Needs:** User provisioning, facility onboarding, integration health monitoring, no GCP expertise assumed beyond runbooks in [Deployment Guide](10_Deployment_Guide.md).

## 4. KPIs

| KPI | Definition | Baseline (Sikar, HMIS 2024-25) | Target M12 | Measured via |
|---|---|---|---|---|
| Stock-out days / facility / month (essential list) | Days with zero stock of any EDL item | 6.2 | ≤ 3.0 | `swasthyaops_analytics.stockout_days` |
| Forecast precision @ 14 days | Predicted stock-outs that occurred | — | ≥ 0.75 | Forecast Agent eval pipeline ([AI Architecture](06_AI_Architecture.md) §8) |
| Doctor attendance capture rate | Facilities reporting attendance daily | ~0 (paper) | ≥ 90% | `facility.attendance.recorded` event volume |
| Anomaly → intervention median latency | Alert created → recommendation approved | weeks | < 8 working h | `alerts` + `recommendations` timestamps |
| Daily active facilities | Facilities with ≥ 1 event/day | 0 | ≥ 85% | BigQuery DAU query |
| Briefing engagement | DHO/DM opens daily briefing | — | ≥ 80% of days | Firebase Analytics |
| Voice entry share | Facility events entered by voice | — | ≥ 40% | `source=voice` field on events |
| P95 API latency | Command center reads | — | < 800 ms | Cloud Monitoring SLO |

## 5. Functional Requirements

IDs are referenced by the [TRD](02_TRD.md), [API Specification](05_API_Specification.md), and acceptance tests in [Testing Strategy](12_Testing_Strategy.md).

### FR-1 Facility Operations Capture
- **FR-1.1** Facility staff can record stock receipts, issues, adjustments, and expiries per item (EDL catalog of 381 items, [Data Pipeline](14_Data_Pipeline.md) §3.3), via form, barcode, or voice; each write publishes `facility.inventory.updated`.
- **FR-1.2** Staff can record daily OPD footfall with symptom-category breakdown (fever, diarrheal, respiratory, injury, ANC, other); publishes `facility.footfall.recorded`.
- **FR-1.3** Doctor/staff attendance recorded daily (present/absent/on-duty-elsewhere/leave with type); publishes `facility.attendance.recorded`.
- **FR-1.4** Bed status per bed (occupied/available/maintenance) for CHCs and DH; publishes `facility.beds.updated`.
- **FR-1.5** Diagnostic test availability (functional/non-functional/reagent-out) for the facility's sanctioned test list; publishes `facility.labs.updated`.
- **FR-1.6** All captures work fully offline; sync on reconnect with last-write-wins per field and conflict surfacing ([App Flow](08_App_Flow.md) §7).

### FR-2 AI Command Center (district view)
- **FR-2.1** Live district map (Google Maps) with facility markers colored by composite health score; filterable by facility type and alert class.
- **FR-2.2** Alert inbox: stock-out predictions, attendance anomalies, footfall spikes, bed saturation, lab downtime — each with evidence, severity, and status workflow (`open → acknowledged → in_progress → resolved | dismissed`).
- **FR-2.3** Recommendation review: AI-drafted interventions (stock transfer between facilities, emergency indent, staffing directive, outbreak response checklist) with one-click approve/edit/reject; approval generates a formatted order PDF and notifies affected facilities.
- **FR-2.4** Facility drill-down: 90-day trends for stock, footfall, attendance, beds, labs; comparison against district median.
- **FR-2.5** Natural-language ops queries ("which PHCs will run out of ORS before the 15th?") answered by the Planner Agent with citations to underlying data.

### FR-3 Forecasting & Intelligence
- **FR-3.1** Per-facility, per-item consumption forecast (21-day horizon, retrained weekly) via BigQuery ML; stock-out date = current stock ÷ forecast burn.
- **FR-3.2** Disease Intelligence Agent correlates footfall symptom mix, IDSP alerts, and weather (monsoon → vector-borne) to raise `alerts.outbreak.suspected` with confidence and affected-area geometry.
- **FR-3.3** Footfall forecast per facility (market days, seasons, campaigns) to pre-position staff.

### FR-4 Briefings, Reports & Notifications
- **FR-4.1** Daily 07:00 IST executive briefing per district: top 5 risks, overnight changes, pending approvals; generated in English and Hindi, text + TTS audio; delivered in-app, email, and SMS summary.
- **FR-4.2** Monthly district performance report (PDF, state-review format) auto-generated on the 1st; archived in Cloud Storage.
- **FR-4.3** Notification routing respects role, severity, quiet hours (22:00–06:00 except severity=critical), and channel preference (push/SMS/email).

### FR-5 Administration
- **FR-5.1** Role-based access: `state_admin`, `district_admin` (DHO), `dm`, `facility_incharge`, `pharmacist`, `lab_tech`, `viewer` — permissions matrix in [Security](13_Security.md) §4.
- **FR-5.2** Facility onboarding wizard (import from Health Centre Directory, verify geo-pin, assign staff).
- **FR-5.3** Full audit log of every human approval and every agent action ([Database Schema](04_Database_Schema.md) `audit_logs`).

## 6. Non-Functional Requirements

| ID | Requirement | Target | Verified in |
|---|---|---|---|
| NFR-1 | Availability (API + web) | 99.5% monthly (pilot), 99.9% (scale) | Cloud Monitoring SLO, [TRD](02_TRD.md) §9 |
| NFR-2 | Read latency, command center P95 | < 800 ms | k6 load suite, [Testing](12_Testing_Strategy.md) §6 |
| NFR-3 | Event ingestion → dashboard visibility | < 15 s P95 | E2E latency probe |
| NFR-4 | Offline operation window | ≥ 72 h of local capture | PWA tests |
| NFR-5 | Concurrency | 1 district: 500 concurrent users; design headroom: 50 districts | Cloud Run autoscaling, [TRD](02_TRD.md) §8 |
| NFR-6 | Data residency | All data in `asia-south1`/`asia-south2` (India) | Terraform org policy, [Security](13_Security.md) §6 |
| NFR-7 | Accessibility | WCAG 2.1 AA | axe-core CI gate, [UI/UX](09_UI_UX_Guidelines.md) §7 |
| NFR-8 | Languages | English + Hindi UI; briefings EN/HI; voice input HI/EN | Translation API |
| NFR-9 | AI cost ceiling | ≤ ₹18,000 (~$210)/district/month at pilot load | [AI Architecture](06_AI_Architecture.md) §7 |
| NFR-10 | Recovery | RPO 1 h (Firestore PITR), RTO 4 h | DR runbook, [Deployment](10_Deployment_Guide.md) §9 |
| NFR-11 | Auditability | Every agent recommendation traceable to inputs and prompt version | `agent_runs` collection |

## 7. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Facility staff don't enter data (adoption) | High | Fatal | Voice-first entry < 30 s; offline PWA; entry burden replaces paper registers (not additive); DHO-visible compliance leaderboard |
| Attendance tracking perceived as surveillance → sabotage | High | High | Frame as "duty visibility"; absence reasons first-class; no automatic punitive workflow — human DHO always in the loop |
| HMIS/IDSP data quality poor or delayed | High | Medium | Platform's own event stream is primary; public datasets are priors/backfill only ([Data Pipeline](14_Data_Pipeline.md) §2) |
| Gemini hallucination in recommendations | Medium | High | Structured tool-calling only (no free-text data claims); citations required; human approval gate on every intervention; eval suite in CI ([AI Architecture](06_AI_Architecture.md) §8) |
| Connectivity dead zones | High | Medium | 72 h offline buffer; SMS fallback for critical alerts |
| GCP cost overrun | Medium | Medium | Budget alerts at 50/80/100%; context caching; Gemini Flash for high-volume paths |
| Government procurement/data approvals delay | Medium | High | Pilot uses only public + platform-generated data; MoU template ready; DPDP-compliant by design ([Security](13_Security.md) §2) |
| Key-person dependency (single DHO champion) | Medium | Medium | Train deputy + statistics officer; value visible to facility staff independently |

## 8. Success Metrics (pilot exit criteria, month 12)

1. ≥ 85% facilities active daily (KPI table §4) for 8 consecutive weeks.
2. Stock-out days reduced ≥ 40% vs. same-quarter baseline.
3. ≥ 100 approved AI-drafted interventions with ≥ 70% marked "effective" at 30-day follow-up.
4. DHO Net Promoter Score ≥ 40; zero data-privacy incidents.
5. State NHM signs scale-out MoU for ≥ 5 additional districts ([Roadmap](16_Future_Roadmap.md)).

## 9. Edge Cases

| Case | Expected behavior |
|---|---|
| Two pharmacists edit the same stock item offline | Field-level last-write-wins; both transactions preserved in ledger; discrepancy > 10% raises reconciliation task ([App Flow](08_App_Flow.md) §7.3) |
| Facility reports zero footfall 3+ days | Not treated as "healthy"; Doctor Agent raises `alerts.staffing.gap` (probable non-reporting) |
| Stock transfer approved but source facility consumed the buffer meanwhile | Recommendation carries a validity snapshot; execution re-validates stock and re-plans if < 80% of promised qty remains |
| Gemini API unavailable | Deterministic fallbacks: threshold-based alerts continue; briefing degrades to templated summary; queue drains on recovery ([AI Architecture](06_AI_Architecture.md) §5) |
| Monsoon knocks out facility for a week | Facility auto-marked `stale` after 48 h silence; excluded from district aggregates with visible badge, not silently zeroed |
| New medicine added to EDL mid-year | Catalog versioned in `config/medicine_catalog`; forecasts start after 28 days of history, threshold alerts immediately |
| User has roles in two districts | JWT carries `district_ids[]`; UI scopes per selected district; cross-district reads denied by Firestore rules |
| Clock skew on offline device | Server timestamp authoritative; client `recorded_at` preserved for clinical ordering; > 24 h skew flagged |

## 10. Future Scope (explicitly out of pilot)

Patient-level clinical records (ABDM/ABHA integration), e-prescriptions, ambulance dispatch, private-facility data, state/national roll-up dashboards, supply-chain integration with Rajasthan Medical Services Corporation ERP. Rationale and sequencing in [Future Roadmap](16_Future_Roadmap.md).

## 11. Acceptance Criteria (release gates)

**Gate A — Facility MVP (Sprint 4, [Implementation Plan](11_Implementation_Plan.md)):**
- AC-A1: Pharmacist records a stock issue on an offline Android phone; on reconnect the event appears in the command center in < 15 s.
- AC-A2: Voice utterance "आज ओपीडी अस्सी, दस्त के पंद्रह" creates a correct footfall record ≥ 90% of the time on the 200-utterance eval set.
- AC-A3: All FR-1 writes appear in `swasthyaops_curated` BigQuery tables within 5 min.

**Gate B — Command Center (Sprint 7):**
- AC-B1: DHO sees a stock-out prediction with ≥ 14-day lead on seeded consumption data; drill-down shows the forecast curve and current stock.
- AC-B2: Approving a transfer recommendation generates a PDF order and push notification to both facilities in < 60 s.
- AC-B3: Map renders 110 facilities with live scores in < 2 s on a 10 Mbps connection.

**Gate C — Pilot readiness (Sprint 12):**
- AC-C1: All NFR targets met in staging load test (500 VU, 1 h soak).
- AC-C2: Agent eval suite ≥ thresholds in [AI Architecture](06_AI_Architecture.md) §8; zero critical findings in security review ([Security](13_Security.md) §9).
- AC-C3: Daily briefing generated in EN+HI with audio for 14 consecutive days without manual intervention.
