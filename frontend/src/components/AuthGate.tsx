'use client';

/**
 * AuthGate — client boundary for the command-center route group.
 * Shows a branded splash while Firebase resolves the persisted session,
 * then either renders children or redirects to /login.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import { useAuth } from '@/lib/auth';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Stack spacing={2.5} alignItems="center">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '@keyframes splashPulse': {
                '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                '50%': { transform: 'scale(1.06)', opacity: 0.85 },
              },
              animation: 'splashPulse 1.6s ease-in-out infinite',
            }}
          >
            <HealthAndSafetyIcon sx={{ fontSize: 32 }} />
          </Box>
          <Stack spacing={1} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              SwasthyaOps
            </Typography>
            <CircularProgress size={20} thickness={4} />
          </Stack>
        </Stack>
      </Box>
    );
  }

  return <>{children}</>;
}
