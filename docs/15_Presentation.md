# 15 — Presentation

**Status:** Ready · **Owner:** PM · **Last updated:** 2026-07-06
**Related:** [PRD](01_PRD.md) (numbers cited below) · [System Architecture](03_System_Architecture.md) (diagram to show) · [App Flow](08_App_Flow.md) (demo screens)
**Assets:** demo runs on the **staging** environment with the seeded Sikar dataset ([scripts/seed_firestore.py](../scripts/seed_firestore.py) `--demo-scenario` flag pre-loads the storyline below).

---

## 1. Five-minute pitch (script, timed)

**[0:00–0:40] The problem — make it human.**
> "In District Sikar, Rajasthan, there are 110 government health facilities serving 2.7 million people. Today, the District Health Officer will find out about a medicine stock-out the same way she always does — when a mother is turned away and someone eventually calls. India's HMIS collects health data, but it arrives monthly, aggregated, six weeks late. Districts don't have a data problem. They have a *reaction time* problem: the average gap between a facility failing and the district acting is measured in weeks."

**[0:40–1:20] The idea.**
> "SwasthyaOps AI is an AI operating system for district healthcare — an AI command center for the district administration. Every stock issue, every attendance mark, every bed status from every PHC and CHC becomes a real-time event. Eleven specialized AI agents on Vertex AI watch that stream: they forecast stock-outs three weeks out, detect outbreak signals a week before the official weekly cycle, and — this is the key part — they don't just alert. They draft the actual government intervention: the transfer order, the indent, the staffing directive. The officer reviews, edits, approves. AI drafts; humans sign."

**[1:20–3:50] Live demo (§2).**

**[3:50–4:30] Why this is deployable, not a demo.**
> "Three deliberate choices make this pilotable by a Ministry. First: no patient data — we operate on operational aggregates, so DPDP risk is designed out, not mitigated. Second: it works on a pharmacist's ₹8,000 Android phone, offline for 72 hours, in Hindi, by voice. Adoption is the hard problem, so we engineered for it first. Third: it runs entirely on Google Cloud serverless — Cloud Run, Pub/Sub, Firestore, BigQuery, Gemini — costing about ₹35,000 per district per month all-in, scaling to fifty districts with zero architecture change."

**[4:30–5:00] The ask & vision.**
> "We're ready for a 12-month pilot in Sikar: the exit criteria are public in our PRD — 40% fewer stock-out days, interventions in hours not weeks. 750 districts, 160,000 PHCs. The playbook that gave software operations SRE is what district healthcare has been missing. We built it."

## 2. Judge demo (2.5 min, staged storyline "Monsoon Week in Sikar")

Pre-seeded state: ORS burn rising at 3 facilities for 10 days, footfall diarrheal spike, monsoon weather loaded, one pending recommendation, briefing generated at 07:00.

| Step | Screen | Beat | Say |
|---|---|---|---|
| 1 | S12 Briefing (phone) | Play 15 s of the Hindi TTS audio | "This is what the District Magistrate got at 7 AM — 90 seconds, two decisions pending." |
| 2 | S2 Command Center (desktop) | Map: two red facilities in the north; alert stream live | "Every marker is a live facility. Red isn't yesterday's report — it's now." |
| 3 | S4 Alert Detail | Stock-out prediction, forecast fan chart, T-6 days | "BigQuery ML sees PHC Losal exhausting ORS in six days — before a single patient is turned away." |
| 4 | S6 Recommendation | AI-drafted transfer: 40 ORS, CHC Fatehpur → PHC Losal; edit qty to 30; approve with biometric | "The Inventory Agent found a donor 22 minutes away with surplus, drafted the order. I edit, approve — the signed PDF and notifications are already at both facilities." |
| 5 | S9 PWA (phone, airplane mode ON) | Record a stock issue by **voice in Hindi**; toggle airplane off; watch S2 update | "And here's the other end — offline, voice, Hindi. Reconnect… and the district sees it in seconds. This loop is the product." |
| 6 | S14 Ask | "Which PHCs will run out of ORS before the 15th?" → cited answer | "Every claim is a citation chip — click it, see the underlying data. No hallucinated numbers reach an officer." |

Fallback plan: if venue connectivity fails, a Screen Studio recording of steps 1–6 is on local disk; the narrative script works over it unchanged.

## 3. Architecture explanation (90 s, for technical judges)

Show [System Architecture](03_System_Architecture.md) §2 diagram and walk one event through it:

> "One pharmacist taps 'issue 12 ORS'. The PWA outbox replays it to Cloud Run with an idempotency key. `svc-api` commits the ledger to Firestore and publishes `facility.inventory.updated` to Pub/Sub — everything downstream is asynchronous and stateless. A BigQuery subscription lands it in the warehouse; nightly, `ARIMA_PLUS` re-forecasts 21-day burn for every item at every facility — deterministic ML, no LLM guessing at numbers. When a threshold trips, the Planner Agent on Vertex AI Agent Engine dispatches the Inventory Agent, which works only through typed tools — it can read stock and rank donors by Maps travel time, but it physically cannot execute anything. The Recommendation Agent drafts the intervention with a validity snapshot; a human approves; only then do notifications and the order PDF fan out. Every agent run is audited: prompt version, tool calls, tokens, cost — one document reconstructs any decision. Gemini down? Threshold alerts and templated briefings keep running — the AI degrades to boring, never to broken."

Anticipated judge questions & answers: **Why not Kafka?** → per-message pricing at 4 k events/day vs 3-broker fixed cost + no ops team ([ADR-0001](../architecture/adr/0001-pubsub-over-kafka.md)). **Hallucinations?** → constrained decoding, citation validation, invalid actions unrepresentable at the tool layer, human gate ([AI Architecture](06_AI_Architecture.md) §3). **Adoption?** → voice + offline + replaces paper registers rather than adding to them; compliance visible to the DHO ([PRD](01_PRD.md) §7). **Cost?** → ~$196 AI + ~$200 infra per district/month at pilot load ([AI Architecture](06_AI_Architecture.md) §7).

## 4. Slide skeleton (10 slides)

1. Title — SwasthyaOps AI: AI Operating System for District Healthcare
2. The reaction-time problem (weeks → hours) — one stat, one photo
3. The loop: sense → forecast → draft → human approves → act
4. Demo (live)
5. Architecture on one slide (§3 diagram)
6. The 11 agents and the one rule: AI drafts, humans sign
7. Built for the last mile: offline / voice / Hindi / ₹8k phone
8. Deployability: no patient PII, DPDP-by-design, ₹35k/district/month
9. Pilot plan & public exit criteria ([PRD](01_PRD.md) §8, [Implementation Plan](11_Implementation_Plan.md))
10. 750 districts. The SRE playbook for public health. The ask.
