# Frontend — Command Center & Facility PWA

Next.js 14 (App Router) · TypeScript · Tailwind + MUI v6 (Material 3) · Firebase Hosting.
One build serves both experiences, role-routed after sign-in ([docs/08_App_Flow.md](../docs/08_App_Flow.md) §1):
admin roles → Command Center; facility roles → PWA screens (offline shell from [/mobile](../mobile/)).

```
src/
├── app/                       # App Router: (auth)/sign-in, (command)/..., (facility)/...
│   ├── layout.tsx             # theme provider, locale provider, auth boundary
│   └── (command)/page.tsx     # S2 Command Center
├── theme/
│   ├── tokens.ts              # compiled from ../stitch_screens/design_*.md — the ONLY color source
│   └── theme.ts               # MUI theme (light/dark) built from tokens
├── lib/
│   ├── firebase.ts            # app init, auth, Firestore with offline persistence
│   ├── api.ts                 # typed /v1 client (types generated: npm run gen:api → openapi-typescript)
│   ├── outbox.ts              # PWA write queue → POST /v1/sync/batch (docs/08 §7.2, lives in ../mobile/pwa)
│   └── i18n/                  # en.json, hi.json — no hardcoded strings (docs/09 §6)
├── components/                # KpiTile, AlertStream, DistrictMap, ApprovalCard, VoiceEntrySheet, SyncChip...
tests/a11y/                    # Playwright + axe: 16 screens × 2 themes × 3 breakpoints (docs/12 §8)
```

Rules enforced in CI: `no-raw-colors` lint (tokens only, [docs/09](../docs/09_UI_UX_Guidelines.md) §3), i18n key lint, axe zero serious violations, tsc strict.

```bash
npm install
npm run dev                    # http://localhost:3000 against swasthyaops-dev
npm run build && firebase deploy --only hosting   # via CI normally (docs/10 §7)
```
