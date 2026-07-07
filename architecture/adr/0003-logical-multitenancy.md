# ADR-0003 — Logical multi-tenancy (single project per env) over per-district projects

**Status:** Accepted · 2026-05-19 · Deciders: tech lead, security
**Context refs:** [docs/02_TRD.md](../../docs/02_TRD.md) §8, §16 · [docs/13_Security.md](../../docs/13_Security.md) §4 · [docs/16_Future_Roadmap.md](../../docs/16_Future_Roadmap.md)

## Context

The pilot is one district; the design target is 50, and the national number is 750+. Options: (a) a GCP project per district, (b) one project per environment with `district_id` as a tenancy key on every row/document/event, (c) per-state projects later.

## Decision

**(b) Logical tenancy now**: single project per environment; `district_id` is a mandatory field on every Firestore document, Pub/Sub envelope, and BigQuery row; enforcement is claim-derived scoping in `svc-api` plus Firestore security rules, tested by the role-matrix E2E probe ([Testing](../../docs/12_Testing_Strategy.md) §3 journey 8). Per-**state** projects become the isolation boundary at Horizon 3 (state = separate legal data fiduciary), districts stay logical within a state.

## Rationale

- Per-district projects at 750 districts = 750× Terraform states, quota requests, budget alerts, Firebase configs, deploy targets — an ops model that guarantees failure for a public-sector operator.
- District data sensitivity is uniform (same data classes, same regulator); isolation needs are access-control-shaped, not blast-radius-shaped.
- Cross-district features are real product requirements (state dashboards, donor-facility search near district borders in Horizon 1) — hard project boundaries would fight the roadmap.
- Cost attribution per district is achievable with labels + BigQuery billing export, not projects.

## Consequences & guardrails

- Every query path MUST derive `district_id` from JWT claims, never from request input — a code-review checklist item and lint rule (`tenancy-scope-required` decorator on route handlers, [backend/app/core/auth.py](../../backend/app/core/auth.py)).
- A cross-tenant leak is a Sev1 incident class ([Security](../../docs/13_Security.md) §10) with a dedicated E2E probe.
- Noisy-neighbor risk (one district's spike affecting another) is bounded by Cloud Run autoscaling and per-district rate limits; revisit dedicated instances-per-state at Horizon 2 volumes.
