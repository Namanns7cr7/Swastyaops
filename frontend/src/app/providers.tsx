'use client';

/**
 * Client providers: MUI ThemeProvider supporting manual Light/Dark mode toggling
 * with local storage persistence and system preference fallback.
 */
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { buildTheme } from '@/theme/theme';
import { AuthProvider } from '@/lib/auth';

interface ColorModeContextType {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
}

export const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
});

export function useColorMode() {
  return useContext(ColorModeContext);
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage or fallback to OS theme
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as 'light' | 'dark' | null;
    if (savedMode) {
      setMode(savedMode);
    } else {
      setMode(prefersDark ? 'dark' : 'light');
    }
    setMounted(true);
  }, [prefersDark]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        setMode((prevMode) => {
          const nextMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('theme-mode', nextMode);
          return nextMode;
        });
      },
    }),
    [mode]
  );

  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>
          <AuthProvider>{children}</AuthProvider>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
