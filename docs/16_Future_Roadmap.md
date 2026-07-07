# 16 — Future Roadmap

**Status:** Approved · **Owner:** Product · **Last updated:** 2026-07-06
**Related:** [PRD](01_PRD.md) §8, §10 · [TRD](02_TRD.md) §8 (scale headroom) · [Security](13_Security.md) §2 · [Implementation Plan](11_Implementation_Plan.md) (Phase 4 feeds Horizon 1)

Principle: the pilot scope ([PRD](01_PRD.md)) is deliberately narrow — operational aggregates, one district, human-approved interventions. Each horizon below unlocks only after the previous one's exit criteria are met. We say no until the data says yes.

---

## Horizon 1 — Prove & harden (months 12–18)

Gate to enter: pilot exit criteria met ([PRD](01_PRD.md) §8).

| Item | Description | Builds on |
|---|---|---|
| 5-district Rajasthan scale-out | Same architecture, logical tenancy already in place ([ADR-0003](../architecture/adr/0003-logical-multitenancy.md)); onboarding wizard target < 1 day/district ([App Flow](08_App_Flow.md) §9) | TRD §8 headroom |
| State dashboard (S12 expansion) | Cross-district comparison, state NHM persona P5 becomes primary | `swasthyaops_analytics` already district-keyed |
| RMSC supply-chain integration | Indent recommendations post directly to Rajasthan Medical Services Corporation e-Aushadhi (API/SFTP), closing the loop from "draft indent" to "order placed" | Recommendation Agent `emergency_indent` action |
| Forecast v2 | Hierarchical reconciliation (district↔facility), campaign/festival calendars as regressors, Vertex AI TimesFM evaluation vs ARIMA_PLUS champion | Forecast Agent metrics history |
| Rajasthani + Marwari voice | STT custom recognizer training on pilot voice corpus (consented, anonymized) | Voice eval harness |
| Agent memory audit UI v2 | DHO-editable standing instructions with approval trail | Memory Bank (S15) |

## Horizon 2 — Clinical & citizen edges (months 18–30)

Gate: 5-district cohort replicates KPI gains; state MoU for full-state rollout.

| Item | Description | New obligations |
|---|---|---|
| **ABDM integration** | Facility registry ↔ HFR sync; staff ↔ HPR; begin ABHA-linked *encounter counts* (still not clinical records) | ABDM sandbox certification; [Security](13_Security.md) reclassification review |
| Patient-level pilot (opt-in facilities) | e-prescription + dispensing link, closing stock ↔ prescription reconciliation | Full DPDP Significant Data Fiduciary posture, CMEK, DPIA, consent manager — the deferred items in [Security](13_Security.md) §6 become mandatory |
| Referral & ambulance coordination | Bed Agent routing + 108 ambulance ETA integration | Maps Fleet routing |
| Citizen-facing facility finder | Public read-only layer (services, timings, stock of key items) — accountability pressure as adoption lever | Public API tier + Cloud CDN |
| CHO/ANM sub-centre tier | Extend capture to 400+ Sub Centres (SC type already in schema) | Scale test at 5× facility count |

## Horizon 3 — National platform posture (months 30+)

Multi-state tenancy (org hierarchy per state, data residency unchanged); national command view for MoHFW; open agent-tool SDK so states add local agents (e.g. a Kerala flood-response agent) against the same tool/audit contract; public health research data service (differential-privacy aggregates from `swasthyaops_analytics`); alignment track with U-WIN/IHIP as those platforms evolve.

## Deliberately rejected (and why)

| Idea | Why not |
|---|---|
| Autonomous agent execution (no human gate) | The gate is the trust model that makes government adoption possible; revisit only with years of approval-rate evidence, and even then per-action-class |
| Patient diagnosis / clinical decision support | Different product, different regulatory regime (medical device), different liability |
| Blockchain supply-chain provenance | Append-only ledger + audit log already provides tamper-evidence proportional to the threat |
| Per-district GCP projects | Operational burden at 750 districts would be fatal; logical tenancy + org policies suffice ([ADR-0003](../architecture/adr/0003-logical-multitenancy.md)) |
| Building our own HMIS replacement | We interoperate with HMIS; replacing national reporting infrastructure is a decade-scale political project, not a product feature |

## Technical debt register (accepted consciously at pilot)

1. No Dataflow — BigQuery subscription + scheduled ELT is enough below ~1 k events/s; introduce Dataflow at Horizon 2 volumes.
2. No Memorystore — revisit at ≥ 10 districts ([TRD](02_TRD.md) §10).
3. Manual HMIS download step — portal has no API; automate via RPA only if monthly cadence becomes a bottleneck.
4. Single-region serving — DR is cross-region restore (RTO 4 h), not active-active; upgrade at state scale where RTO minutes matter.
5. LLM-based IDSP PDF extraction — replace with structured feed the day IDSP/IHIP exposes one ([Data Pipeline](14_Data_Pipeline.md) §2.7).
