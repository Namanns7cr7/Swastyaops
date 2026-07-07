/**
 * Design tokens — compiled from the canonical Stitch exports:
 *   light: stitch_screens/design_swasthyaops_ai_light.md
 *   dark:  stitch_screens/design_enterprise_precision_dark.md
 * Do not edit values here without updating the source files (design review gate,
 * docs/09_UI_UX_Guidelines.md §8). Components must reference tokens, never raw hex
 * (`no-raw-colors` lint).
 */

export const light = {
  surface: '#f7fafd',
  surfaceDim: '#d7dade',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f1f4f7',
  surfaceContainer: '#ebeef2',
  surfaceContainerHigh: '#e5e8ec',
  surfaceContainerHighest: '#e0e3e6',
  onSurface: '#181c1f',
  onSurfaceVariant: '#414754',
  outline: '#727785',
  outlineVariant: '#c1c6d6',
  primary: '#005bbf',
  onPrimary: '#ffffff',
  primaryContainer: '#1a73e8',
  onPrimaryContainer: '#ffffff',
  secondary: '#006b5f',
  onSecondary: '#ffffff',
  secondaryContainer: '#8df5e4',
  onSecondaryContainer: '#007165',
  tertiary: '#5c5e60',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
} as const;

/** Dark palette from design_enterprise_precision_dark.md (kept in exact sync). */
export const dark = {
  surface: '#101418',
  surfaceDim: '#101418',
  surfaceContainerLowest: '#0b0f12',
  surfaceContainerLow: '#181c20',
  surfaceContainer: '#1c2024',
  surfaceContainerHigh: '#272a2f',
  surfaceContainerHighest: '#31353a',
  onSurface: '#e0e3e6',
  onSurfaceVariant: '#c1c6d6',
  outline: '#8b90a0',
  outlineVariant: '#414754',
  primary: '#adc7ff',
  onPrimary: '#002e6a',
  primaryContainer: '#004493',
  onPrimaryContainer: '#d8e2ff',
  secondary: '#70d8c8',
  onSecondary: '#003731',
  secondaryContainer: '#005048',
  onSecondaryContainer: '#8df5e4',
  tertiary: '#c5c7c8',
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
} as const;

/** Semantic status colors — the only saturated color in the app (docs/09 §2). */
export const status = {
  critical: { light: { fg: '#ba1a1a', bg: '#ffdad6' }, dark: { fg: '#ffb4ab', bg: '#93000a' } },
  high: { light: { fg: '#8a4d00', bg: '#ffddb8' }, dark: { fg: '#ffb95c', bg: '#6a3c00' } },
  ok: { light: { fg: '#006b5f', bg: '#8df5e4' }, dark: { fg: '#70d8c8', bg: '#005048' } },
  stale: { light: { fg: '#727785', bg: '#e0e3e6' }, dark: { fg: '#8b90a0', bg: '#31353a' } },
} as const;

export const radius = { sm: 4, md: 12, lg: 16, xl: 24, full: 9999 } as const;
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const typography = {
  fontFamily: "'Inter', 'Noto Sans Devanagari', sans-serif",
  displayLg: { fontSize: 57, fontWeight: 700, lineHeight: '64px', letterSpacing: -0.25 },
  headlineLg: { fontSize: 32, fontWeight: 600, lineHeight: '40px' },
  headlineMd: { fontSize: 28, fontWeight: 500, lineHeight: '36px' },
  titleLg: { fontSize: 22, fontWeight: 500, lineHeight: '28px' },
  titleMd: { fontSize: 16, fontWeight: 600, lineHeight: '24px', letterSpacing: 0.15 },
  bodyLg: { fontSize: 16, fontWeight: 400, lineHeight: '24px', letterSpacing: 0.5 },
  bodyMd: { fontSize: 14, fontWeight: 400, lineHeight: '20px', letterSpacing: 0.25 },
  labelLg: { fontSize: 14, fontWeight: 500, lineHeight: '20px', letterSpacing: 0.1 },
  labelMd: { fontSize: 12, fontWeight: 500, lineHeight: '16px', letterSpacing: 0.5 },
} as const;

/** Breakpoints per docs/09 §4. */
export const breakpoints = { mobile: 0, tablet: 600, desktop: 1240 } as const;
