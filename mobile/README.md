# Mobile — Facility PWA

**Decision: the facility mobile experience is an installable offline-first PWA, not a native app.**
Rationale: the adoption-critical constraints ([PRD](../docs/01_PRD.md) P2/P3 personas) are low-end
Android, intermittent 4G, zero app-store friction for government phones, and instant updates during
the pilot iteration loop. The PWA shares the [frontend](../frontend/) codebase (one Next.js build,
role-routed — [docs/08_App_Flow.md](../docs/08_App_Flow.md) §1), so facility screens S8–S11 and
command screens ship together. A native wrapper (TWA) is a one-day task if Play Store distribution
is later required ([Roadmap](../docs/16_Future_Roadmap.md) Horizon 1 revisit).

This directory holds the PWA-specific layer consumed by the frontend build:

```
pwa/
├── manifest.json          # install metadata, icons, shortcuts (stock entry, footfall)
├── service-worker.ts      # Workbox: precache shell, runtime cache, Background Sync trigger
└── outbox.ts              # IndexedDB write queue → POST /v1/sync/batch (docs/08 §7.2)
```

## Offline contract (NFR-4: 72 h)

| Concern | Mechanism |
|---|---|
| Reads | Firestore SDK persistent cache ([frontend/src/lib/firebase.ts](../frontend/src/lib/firebase.ts)) — every screen renders instantly from local data with a staleness chip |
| Writes | `outbox.ts`: UUIDv7 idempotency key per mutation, optimistic local apply, ordered replay on reconnect via `/v1/sync/batch`; server warnings surface as a review list ([docs/08](../docs/08_App_Flow.md) §7.2–7.3) |
| Shell | Service worker precaches the app shell + fonts + i18n bundles; map tiles runtime-cached LRU 50 MB |
| Voice | Requires connectivity (cloud STT); offline mic tap → toast + pre-filled form fallback ([docs/08](../docs/08_App_Flow.md) §6) |
| Sync trigger | Background Sync API where available; foreground reconnect listener as fallback (Background Sync is Chromium-only — acceptable: pilot fleet is Android/Chrome) |

## Device floor

Tested against: Android 10+, 2 GB RAM, Chrome ≥ 100, 320 px width. Touch targets ≥ 48 dp,
Devanagari rendering, TalkBack pass — [docs/09_UI_UX_Guidelines.md](../docs/09_UI_UX_Guidelines.md) §7.
