# ADR-0002 — Firestore over Cloud SQL for the serving store

**Status:** Accepted · 2026-05-12 · Deciders: tech lead, backend + frontend leads
**Context refs:** [docs/02_TRD.md](../../docs/02_TRD.md) §4 · [docs/04_Database_Schema.md](../../docs/04_Database_Schema.md) · [docs/08_App_Flow.md](../../docs/08_App_Flow.md) §7

## Context

The serving store backs two very different clients: a realtime command center (live alert stream, map state) and a facility PWA that must run **72 h offline** (NFR-4) on low-end Android devices — the single most adoption-critical requirement in the [PRD](../../docs/01_PRD.md). Candidates: Cloud SQL (Postgres), Firestore, AlloyDB. SQLAlchemy/Postgres is the team's comfort zone; the PRD's offline and realtime requirements are not.

## Decision

**Firestore (Native mode)** is the serving store. Cloud SQL is not deployed. SQLAlchemy appears nowhere in the serving path (per the stack constraint "SQLAlchemy only where required" — it turned out to be required nowhere; relational analytics live in BigQuery).

## Rationale

1. **Offline sync is the product.** Firestore's client SDK gives offline persistence, delta sync, and realtime listeners out of the box. Building equivalent sync on Postgres (custom oplog, conflict handling, WebSocket layer, retry semantics on flaky 4G) is months of the riskiest kind of engineering — infrastructure that isn't the product.
2. **Realtime command center for free.** The S2 alert stream is a Firestore listener; no polling, no socket service.
3. **Security rules as a second enforcement layer.** District/facility tenancy enforced both in `svc-api` and declaratively at the datastore ([Security](../../docs/13_Security.md) §4) — defense in depth a SQL store can't give clients directly.
4. **Zero-ops + scale-to-zero pricing** matches the Cloud Run posture; Cloud SQL is a fixed-cost always-on instance.
5. **The relational workloads (joins, aggregates, ML) belong to BigQuery anyway** — every event lands there ([Architecture](../../docs/03_System_Architecture.md) §6). We are not giving up SQL; we're putting it where it pays.

## Trade-offs accepted

- No multi-document ACID beyond 500-doc transactions → mitigated by design: ledgers are append-only, aggregates are single-doc, cross-entity workflows are event-driven with idempotent consumers.
- No ad-hoc queries on serving data → by policy, analytics queries go to BigQuery; composite indexes are declared in Terraform for every serving query shape ([Database Schema](../../docs/04_Database_Schema.md) §1.6).
- Fan-out reads (e.g. "all inventory across 110 facilities") need collection-group indexes and pagination discipline — documented query patterns only.
- Clients get offline *reads* directly, but all *writes* go through the API outbox pattern ([App Flow](../../docs/08_App_Flow.md) §7.2) — we deliberately do not use Firestore client writes, keeping validation and event emission server-side.
