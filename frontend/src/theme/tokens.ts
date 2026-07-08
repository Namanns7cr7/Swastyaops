/**
 * Design tokens — compiled from the canonical Stitch exports:
 *   light: stitch_screens/design_swasthyaops_ai_light.md
 *   dark:  stitch_screens/design_enterprise_precision_dark.md
 * Do not edit values here without updating the source files (design review gate,
 * docs/09_UI_UX_Guidelines.md §8). Components must reference tokens, never raw hex
 * (`no-raw-colors` lint).
 */

export const light = {
  surface: '#f8f9fa',
  surfaceDim: '#d7dade',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f1f3f4',
  surfaceContainer: '#e8eaed',
  surfaceContainerHigh: '#e1e3e6',
  surfaceContainerHighest: '#dadce0',
  onSurface: '#1f1f1f',
  onSurfaceVariant: '#444746',
  outline: '#747775',
  outlineVariant: '#c4c7c5',
  primary: '#1a73e8',
  onPrimary: '#ffffff',
  primaryContainer: '#d2e3fc',
  onPrimaryContainer: '#174ea6',
  secondary: '#137333',
  onSecondary: '#ffffff',
  secondaryContainer: '#ceead6',
  onSecondaryContainer: '#0d652d',
  tertiary: '#5f6368',
  error: '#d93025',
  onError: '#ffffff',
  errorContainer: '#fce8e6',
  onErrorContainer: '#a50e0e',
} as const;

/** Dark palette from design_enterprise_precision_dark.md (kept in exact sync). */
export const dark = {
  surface: '#1f1f1f',
  surfaceDim: '#1f1f1f',
  surfaceContainerLowest: '#131314',
  surfaceContainerLow: '#2d2e30',
  surfaceContainer: '#333538',
  surfaceContainerHigh: '#3c3e42',
  surfaceContainerHighest: '#48494d',
  onSurface: '#e3e3e3',
  onSurfaceVariant: '#c4c7c5',
  outline: '#8e918f',
  outlineVariant: '#444746',
  primary: '#8ab4f8',
  onPrimary: '#062e6f',
  primaryContainer: '#1a73e8',
  onPrimaryContainer: '#d2e3fc',
  secondary: '#81c995',
  onSecondary: '#0a3f1e',
  secondaryContainer: '#137333',
  onSecondaryContainer: '#ceead6',
  tertiary: '#9aa0a6',
  error: '#f28b82',
  onError: '#5c0a0a',
  errorContainer: '#a50e0e',
  onErrorContainer: '#fce8e6',
} as const;

/** Semantic status colors — the only saturated color in the app (docs/09 §2). */
export const status = {
  critical: {
    light: { fg: '#d93025', bg: '#fce8e6' },
    dark: { fg: '#f28b82', bg: '#442c2c' },
  },
  high: {
    light: { fg: '#e37400', bg: '#fef7e0' },
    dark: { fg: '#fdd663', bg: '#443c24' },
  },
  ok: {
    light: { fg: '#137333', bg: '#ceead6' },
    dark: { fg: '#81c995', bg: '#1e3a2b' },
  },
  stale: {
    light: { fg: '#5f6368', bg: '#e8eaed' },
    dark: { fg: '#9aa0a6', bg: '#3c3e42' },
  },
  info: {
    light: { fg: '#1a73e8', bg: '#d2e3fc' },
    dark: { fg: '#8ab4f8', bg: '#28354a' },
  },
} as const;

/** Elevation shadow system — consistent depth across the app. */
export const elevation = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
  sm: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
  md: '0 2px 6px 0 rgba(60,64,67,0.3), 0 6px 10px 4px rgba(60,64,67,0.15)',
  lg: '0 4px 8px 0 rgba(60,64,67,0.3), 0 8px 12px 6px rgba(60,64,67,0.15)',
} as const;

export const elevationDark = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0,0,0,0.6), 0 1px 3px 1px rgba(0,0,0,0.3)',
  sm: '0 1px 3px 0 rgba(0,0,0,0.6), 0 4px 8px 3px rgba(0,0,0,0.3)',
  md: '0 2px 6px 0 rgba(0,0,0,0.6), 0 6px 10px 4px rgba(0,0,0,0.3)',
  lg: '0 4px 8px 0 rgba(0,0,0,0.6), 0 8px 12px 6px rgba(0,0,0,0.3)',
} as const;

/** Motion tokens — consistent easing and duration. */
export const motion = {
  fast: '150ms',
  normal: '250ms',
  slow: '400ms',
  /** Standard Material motion curve. */
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  /** Emphasis motion for dramatic transitions. */
  easingEmphasized: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
} as const;

export const radius = { sm: 4, md: 8, lg: 12, xl: 16, xxl: 28, full: 9999 } as const;
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const typography = {
  fontFamily: "'Google Sans', 'Inter', 'Noto Sans Devanagari', sans-serif",
  displayLg: { fontSize: 57, fontWeight: 400, lineHeight: '64px', letterSpacing: -0.25 },
  headlineLg: { fontSize: 32, fontWeight: 400, lineHeight: '40px' },
  headlineMd: { fontSize: 28, fontWeight: 400, lineHeight: '36px' },
  titleLg: { fontSize: 22, fontWeight: 400, lineHeight: '28px' },
  titleMd: { fontSize: 16, fontWeight: 500, lineHeight: '24px', letterSpacing: 0.15 },
  bodyLg: { fontSize: 16, fontWeight: 400, lineHeight: '24px', letterSpacing: 0.5 },
  bodyMd: { fontSize: 14, fontWeight: 400, lineHeight: '20px', letterSpacing: 0.25 },
  labelLg: { fontSize: 14, fontWeight: 500, lineHeight: '20px', letterSpacing: 0.1 },
  labelMd: { fontSize: 12, fontWeight: 500, lineHeight: '16px', letterSpacing: 0.5 },
} as const;

/** Breakpoints per docs/09 §4. */
export const breakpoints = { mobile: 0, tablet: 600, desktop: 1240 } as const;

/** Sidebar widths. */
export const sidebar = {
  expanded: 256,
  collapsed: 68,
} as const;
