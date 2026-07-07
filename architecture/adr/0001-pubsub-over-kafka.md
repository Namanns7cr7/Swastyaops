# ADR-0001 — Pub/Sub over Kafka for the event backbone

**Status:** Accepted · 2026-05-12 · Deciders: tech lead, backend leads
**Context refs:** [docs/02_TRD.md](../../docs/02_TRD.md) §1, §3 · [docs/03_System_Architecture.md](../../docs/03_System_Architecture.md) §8

## Context

The platform is event-driven end to end: every facility state change fans out to agents, BigQuery, and notification paths. The obvious candidates were Apache Kafka (self-managed or Confluent Cloud) and Google Cloud Pub/Sub. The deployment reality: a district health deployment with **no dedicated platform-ops team**, bursty low volume (~4.4 k events/day at pilot, ~250 k/day at 50 districts), Cloud Run consumers, and a hard requirement for at-least-once delivery with dead-lettering and auditability.

## Decision

Use **Pub/Sub** for all inter-service messaging. Kafka is not used anywhere in the system.

## Rationale (vs Kafka)

| Dimension | Kafka | Pub/Sub | Weight |
|---|---|---|---|
| Ops burden | Brokers/ZK-KRaft, partitions, rebalancing, upgrades — or a Confluent contract | Zero; fully managed | **Decisive** — no ops team exists |
| Cost at our volume | 3-broker minimum (~$300+/mo) or Confluent basic tier, paid while idle | Per-message; pilot volume ≈ **₹40/month**; free tier covers dev | High |
| Cloud Run integration | Consumer groups need long-running listeners → conflicts with scale-to-zero | Native push subscriptions with OIDC; scale-to-zero preserved | High |
| Ordering | Per-partition, strong | Per-ordering-key (we key on `facility_id` — exactly the granularity we need) | Neutral |
| Delivery semantics | Exactly-once possible (transactions), complex | At-least-once; we require idempotent consumers anyway (offline replay implies dedup) | Neutral |
| Dead-lettering | Manual topic wiring + tooling | Built-in DLQ per subscription with max-attempts | Medium |
| Replay | Excellent (offset rewind, long retention) | 7-day retention + seek; long-term replay via BigQuery `raw.events` (we land everything) | Kafka better, gap closed by design |
| Schema governance | Schema Registry (extra component) | Native topic schemas (protobuf) | Medium |
| Throughput ceiling | Effectively unlimited | 1 MB/s per ordering key, project quotas — orders of magnitude above our 50-district target | Neutral |

## Consequences

- Consumers MUST be idempotent on `event_id` (enforced pattern, [TRD](../../docs/02_TRD.md) §3) since Pub/Sub is at-least-once.
- Historical replay beyond 7 days is a BigQuery batch job over `swasthyaops_raw.events`, not a streaming rewind — acceptable for our reprocessing cases (backfills, new-agent bootstrapping).
- If a future requirement demands sustained > 100 MB/s per-key streams (none foreseen — [Roadmap](../../docs/16_Future_Roadmap.md)), revisit with Managed Kafka; the envelope format is transport-neutral to keep that door open.
