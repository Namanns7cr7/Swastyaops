/**
 * MUI themes built from the Stitch design tokens (docs/09 §1–3).
 * Components never hardcode hex — they read theme.palette or tokens.status.
 */
import { createTheme, type Theme } from '@mui/material/styles';
import { dark, light, radius, typography, elevation, elevationDark, motion } from './tokens';

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
  const isLight = mode === 'light';
  const elev = isLight ? elevation : elevationDark;

  return createTheme({
    ...shared,
    palette: {
      mode,
      primary: { main: t.primary, contrastText: t.onPrimary },
      secondary: { main: t.secondary, contrastText: t.onSecondary },
      error: { main: t.error, contrastText: t.onError },
      background: {
        default: t.surface,
        paper: t.surfaceContainerLowest,
      },
      text: { primary: t.onSurface, secondary: t.onSurfaceVariant },
      divider: t.outlineVariant,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollBehavior: 'smooth',
          },
          body: {
            backgroundColor: t.surface,
            transition: `background-color ${motion.normal} ${motion.easing}`,
          },
          '::selection': {
            backgroundColor: isLight ? t.primaryContainer : t.primaryContainer,
            color: isLight ? t.onPrimaryContainer : t.onPrimaryContainer,
          },
          '::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '::-webkit-scrollbar-thumb': {
            background: t.outlineVariant,
            borderRadius: '4px',
            '&:hover': {
              background: t.outline,
            },
          },
          '@keyframes pageMount': {
            '0%': { opacity: 0, transform: 'translateY(6px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' },
          },
          'main > *': {
            animation: `pageMount ${motion.slow} ${motion.easingEmphasized} both`,
          },
          'main > *:nth-of-type(1)': { animationDelay: '0ms' },
          'main > *:nth-of-type(2)': { animationDelay: '50ms' },
          'main > *:nth-of-type(3)': { animationDelay: '100ms' },
          'main > *:nth-of-type(4)': { animationDelay: '150ms' },
          'main > *:nth-of-type(5)': { animationDelay: '200ms' },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': {
              animationDuration: '0.01ms !important',
              animationIterationCount: '1 !important',
              transitionDuration: '0.01ms !important',
            },
          },
        },
      },

      // ── Cards ──
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: {
            borderRadius: radius.lg,
            border: `1px solid ${t.outlineVariant}`,
            boxShadow: 'none',
            backgroundImage: 'none',
            backgroundColor: t.surfaceContainerLowest,
            transition: `box-shadow ${motion.normal} ${motion.easing}, border-color ${motion.normal} ${motion.easing}`,
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          outlined: {
            borderColor: t.outlineVariant,
          },
        },
      },

      // ── Chips ──
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            borderRadius: radius.sm,
            transition: `all ${motion.fast} ${motion.easing}`,
          },
          sizeSmall: {
            height: 24,
            fontSize: 12,
          },
        },
      },

      // ── Buttons ──
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: radius.full,
            fontWeight: 500,
            letterSpacing: 0.25,
            transition: `all ${motion.fast} ${motion.easing}`,
            '&:active': {
              transform: 'scale(0.98)',
            },
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: elev.xs,
            },
          },
          outlined: {
            borderColor: t.outline,
          },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: radius.full,
            transition: `background-color ${motion.fast} ${motion.easing}`,
          },
        },
      },

      // ── Tables ──
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 500,
              fontSize: 12,
              letterSpacing: 0.5,
              color: t.onSurfaceVariant,
              textTransform: 'uppercase' as const,
              borderBottom: `2px solid ${t.outlineVariant}`,
              backgroundColor: isLight ? t.surfaceContainerLow : t.surfaceContainerLow,
              position: 'sticky' as const,
              top: 0,
              zIndex: 2,
            },
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: `background-color ${motion.fast} ${motion.easing}`,
            '&:hover': {
              backgroundColor: isLight ? t.surfaceContainerLow : t.surfaceContainerHigh,
            },
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottomColor: t.outlineVariant,
            padding: '12px 16px',
          },
        },
      },

      // ── Inputs ──
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: radius.md,
              '& fieldset': {
                borderColor: t.outlineVariant,
                transition: `border-color ${motion.fast} ${motion.easing}`,
              },
              '&:hover fieldset': {
                borderColor: t.outline,
              },
              '&.Mui-focused fieldset': {
                borderColor: t.primary,
                borderWidth: 2,
              },
            },
          },
        },
      },

      // ── Drawer ──
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderLeft: `1px solid ${t.outlineVariant}`,
            boxShadow: elev.lg,
            backgroundColor: t.surfaceContainerLowest,
          },
        },
      },

      // ── AppBar ──
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
          },
        },
      },

      // ── Tooltip ──
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: radius.sm,
            fontSize: 12,
            fontWeight: 500,
            backgroundColor: isLight ? t.onSurface : t.surfaceContainerHighest,
            color: isLight ? t.surface : t.onSurface,
            boxShadow: elev.sm,
          },
        },
      },

      // ── Dialogs ──
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: radius.xxl,
            boxShadow: elev.lg,
          },
        },
      },

      // ── LinearProgress ──
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: radius.full,
            height: 6,
            backgroundColor: isLight ? t.surfaceContainer : t.surfaceContainerHigh,
          },
          bar: {
            borderRadius: radius.full,
          },
        },
      },

      // ── Divider ──
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: t.outlineVariant,
          },
        },
      },

      // ── ListItemButton ──
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            transition: `background-color ${motion.fast} ${motion.easing}`,
          },
        },
      },

      // ── Skeleton ──
      MuiSkeleton: {
        styleOverrides: {
          root: {
            borderRadius: radius.sm,
            backgroundColor: isLight ? t.surfaceContainer : t.surfaceContainerHigh,
          },
        },
      },

      // ── Snackbar ──
      MuiSnackbarContent: {
        styleOverrides: {
          root: {
            borderRadius: radius.md,
            boxShadow: elev.md,
          },
        },
      },
    },
  });
}
