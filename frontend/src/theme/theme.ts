/**
 * MUI themes built from the Stitch design tokens (docs/09 §1–3).
 * Components never hardcode hex — they read theme.palette or tokens.status.
 */
import { createTheme, type Theme } from '@mui/material/styles';
import { dark, light, radius, typography } from './tokens';

const shared = {
  typography: {
    fontFamily: typography.fontFamily,
    h1: { ...typography.headlineLg },
    h2: { ...typography.headlineMd },
    h3: { ...typography.titleLg },
    subtitle1: { ...typography.titleMd },
    body1: { ...typography.bodyLg },
    body2: { ...typography.bodyMd },
    caption: { ...typography.labelMd },
    button: { ...typography.labelLg, textTransform: 'none' as const },
  },
  shape: { borderRadius: radius.md },
};

export function buildTheme(mode: 'light' | 'dark'): Theme {
  const t = mode === 'light' ? light : dark;
  return createTheme({
    ...shared,
    palette: {
      mode,
      primary: { main: t.primary, contrastText: t.onPrimary },
      secondary: { main: t.secondary, contrastText: t.onSecondary },
      error: { main: t.error, contrastText: t.onError },
      background: { default: t.surface, paper: t.surfaceContainerLowest },
      text: { primary: t.onSurface, secondary: t.onSurfaceVariant },
      divider: t.outlineVariant,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: radius.lg,
            border: `1px solid ${t.outlineVariant}`,
            boxShadow: 'none',
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
      MuiButton: { styleOverrides: { root: { borderRadius: radius.full } } },
    },
  });
}
