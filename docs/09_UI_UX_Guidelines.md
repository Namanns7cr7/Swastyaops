# 09 — UI/UX Guidelines

**Status:** Approved · **Owner:** Design · **Last updated:** 2026-07-06
**Related:** [App Flow](08_App_Flow.md) (screens) · [PRD](01_PRD.md) §3 (personas) · Implementation: [frontend/src/theme/](../frontend/src/theme/)
**Design source of truth:** [stitch_screens/design_swasthyaops_ai_light.md](../stitch_screens/design_swasthyaops_ai_light.md) (light) · [stitch_screens/design_enterprise_precision_dark.md](../stitch_screens/design_enterprise_precision_dark.md) (dark) — token values below are excerpts; the Stitch files are canonical and are compiled into Tailwind/MUI themes by [frontend/src/theme/tokens.ts](../frontend/src/theme/tokens.ts).

Design intent in one line: **Google-Health-grade calm for a high-stakes ops room** — Material 3, dense but never cluttered, color reserved for meaning.

---

## 1. Design system

- **Foundation:** Material 3 (MUI v6 + Tailwind utilities). Components use MUI; layout/spacing via Tailwind mapped to the token scale.
- **Typography:** Inter, full scale defined in the Stitch tokens (display-lg 57/64 → label-md 12/16). Numerals: `font-variant-numeric: tabular-nums` on all KPI/table figures.
- **Devanagari:** Noto Sans Devanagari, same scale; line-height +4 px on body sizes for matra clearance. Never render Hindi in Inter fallback.
- **Shape:** radius scale from tokens (`sm 4px → xl 24px`, cards `lg 16px`, chips `full`).
- **Elevation:** M3 surface-container ladder (tokens) instead of shadows for hierarchy; shadows only for modals/menus.

## 2. Color

Palette roles from the Stitch token files — primary `#005bbf` (Google-blue-adjacent, govt-credible), secondary `#006b5f`, error `#ba1a1a`, full surface ladder as defined.

**Semantic status colors (the only place saturated color appears):**

| Status | Light | Dark | Usage |
|---|---|---|---|
| Critical | `#ba1a1a` on `#ffdad6` | `#ffb4ab` on `#93000a` | Severity chips, map markers, KPI breach |
| High | `#8a4d00` on `#ffddb8` | `#ffb95c` on `#6a3c00` | — |
| Medium | `#5c5e60` container | tertiary container | — |
| Healthy/OK | secondary `#006b5f` | `#70d8c8` | Sparingly — absence of red is the default "good" |
| Stale data | outline `#727785`, striped fill | same | Never green, never red ([App Flow](08_App_Flow.md) §8) |

Rules: status is **never conveyed by color alone** (icon + label always — WCAG 1.4.1); map quintile markers pair color with shape (circle/triangle/square); charts use the dataviz-safe ordered palette in `tokens.ts`, one hue family per metric across the whole app (stock = primary blues, footfall = secondary teals, attendance = tertiary neutrals).

## 3. Dark mode

Token set from [design_enterprise_precision_dark.md](../stitch_screens/design_enterprise_precision_dark.md). Behavior: follows OS by default; manual override in S16 persisted per user. Command-center wall-screen mode (S2 fullscreen) defaults dark. All 16 screens must pass contrast in both themes (§7 CI gate); charts re-map to dark-safe variants automatically (no hardcoded hex in components — token references only, enforced by lint rule `no-raw-colors`).

## 4. Responsive grid

| Breakpoint | Cols | Nav | Notes |
|---|---|---|---|
| ≥ 1240 (desktop) | 12, 24 px gutter | Permanent nav rail 80 px, expandable 256 px | Map 8 col + stream 4 col on S2 |
| 600–1239 (tablet) | 8, 16 px | Collapsible rail | Sections stack; touch targets full-size |
| < 600 (mobile) | 4, 16 px | Bottom bar, 5 items max | Primary action as FAB in thumb zone; steppers not keyboards for numbers |

Density: `comfortable` on mobile/tablet, `compact` opt-in on desktop tables (DHO power users). Minimum touch target 48×48 dp everywhere (WCAG 2.5.8 + field-use gloves/sunlight reality).

## 5. Interaction patterns

- **Optimistic UI** for all facility entries (outbox model, [App Flow](08_App_Flow.md) §7.2) with sync chip; **pessimistic** for approvals (S6) — spinner-in-button, server-confirmed only.
- **Destructive/irreversible** (reject recommendation, dismiss alert): reason required, no undo promised, confirmation states consequence ("Facilities will not be notified").
- **Voice:** hold-to-talk mic (not toggle), live waveform + transcript, spoken + visual confirmation before write ([App Flow](08_App_Flow.md) §6).
- **Realtime updates** (alert stream): new items slide in with 2 s highlight; **never** reflow content under the user's finger/cursor — new-items pill ("3 new alerts ↑") when list is scrolled.
- **Numbers:** Indian digit grouping (1,23,456) via `Intl.NumberFormat('en-IN')`; dates `DD MMM YYYY`, IST always.
- **Motion:** M3 duration/easing tokens; all animation respects `prefers-reduced-motion`.

## 6. Language & tone

- Full UI parity EN/HI (i18n keys, no hardcoded strings — CI lint); locale from `users.locale`, switchable in S16 without reload.
- Tone: operational, specific, no blame. "PHC Losal projected to exhaust ORS by 12 Jul" — never "PHC Losal is failing". Attendance language is "duty visibility" framing throughout ([PRD](01_PRD.md) §7 risk).
- Agent-generated text is always visually attributed (subtle ✦ "AI-drafted" chip) and citation-chipped — users must always know what a human wrote vs an agent.

## 7. Accessibility — WCAG 2.1 AA (NFR-7)

| Requirement | Implementation | Verified by |
|---|---|---|
| Contrast ≥ 4.5:1 text, 3:1 UI | Token pairs pre-validated both themes | axe-core in Playwright CI ([Testing](12_Testing_Strategy.md) §8), Storybook a11y addon |
| Keyboard complete | All flows incl. approve/reject; visible focus ring (`primary` 2 px offset 2 px); skip-links; map has keyboard facility-list equivalent | Playwright keyboard suite |
| Screen readers | Landmarks, `aria-live="polite"` on alert stream (assertive only for critical), chart data tables behind `Show as table` toggle | Manual NVDA + TalkBack pass per release |
| Zoom 200% / reflow 320 px | Layout holds, no horizontal scroll | CI viewport test |
| Forms | Labels always visible (no placeholder-as-label), errors linked via `aria-describedby`, `inputmode="numeric"` for counts | axe + review |
| Media | Briefing audio has full text (it *is* text-first); charts have text summaries | Review checklist |
| Timing | No auto-logout under 8 h field shift; OTP resend without page reset | Review checklist |

## 8. Component checklist for every new screen

1. Tokens only (no raw hex/px), both themes verified. 2. All states designed: loading skeleton, empty, error, offline, stale ([App Flow](08_App_Flow.md) §8). 3. EN + HI copy reviewed at both lengths (HI ≈ +25%). 4. Touch targets ≥ 48 dp; keyboard path; axe clean. 5. Numbers tabular + `en-IN` grouping. 6. AI content attributed + cited. 7. Added to Storybook with a11y and viewport stories.
