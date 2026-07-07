'use client';

/**
 * Client providers: MUI theme (light/dark follows OS per docs/09 §3) + baseline.
 * Auth and locale providers join here in Sprints 1–2.
 */
import { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { buildTheme } from '@/theme/theme';

export default function Providers({ children }: { children: React.ReactNode }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(() => buildTheme(prefersDark ? 'dark' : 'light'), [prefersDark]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
