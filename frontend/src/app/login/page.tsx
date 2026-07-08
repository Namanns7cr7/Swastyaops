'use client';

/**
 * /login — Google SSO entry point. Real Firebase Auth (no demo bypass):
 * signed-in users are bounced straight to the command center, everyone else
 * authenticates with their Google account via popup.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import { useTheme, alpha } from '@mui/material/styles';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import PhysicsField from '@/components/PhysicsField';
import { useAuth } from '@/lib/auth';
import { useColorMode } from '@/app/providers';

/** Official multi-color Google "G" mark. */
function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/** Human messages for the auth error codes users can actually hit. */
function describeAuthError(code: string): string {
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled for this Firebase project yet. Enable the Google provider in Firebase Console → Authentication → Sign-in method.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Allow popups for this site and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled before completing.';
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for sign-in. Add it under Firebase Console → Authentication → Settings → Authorized domains.';
    default:
      return `Sign-in failed (${code}). Please try again.`;
  }
}

export default function LoginPage() {
  const theme = useTheme();
  const router = useRouter();
  const { mode, toggleColorMode } = useColorMode();
  const { user, loading, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already authenticated → straight to the command center.
  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? 'auth/unknown';
      setError(describeAuthError(code));
      setBusy(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      {/* Ambient physics background */}
      <PhysicsField density={0.8} opacity={theme.palette.mode === 'dark' ? 0.55 : 0.4} />

      {/* Radial glow anchoring the card */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(600px circle at 50% 42%, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.08)}, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Theme toggle */}
      <Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
        <IconButton
          onClick={toggleColorMode}
          size="small"
          sx={{ position: 'absolute', top: 16, right: 16, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          {mode === 'light' ? <DarkModeOutlinedIcon fontSize="small" /> : <LightModeOutlinedIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      <Card
        sx={{
          width: '100%',
          maxWidth: 400,
          p: { xs: 3, sm: 4 },
          position: 'relative',
          backdropFilter: 'blur(12px)',
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.82 : 0.9),
          boxShadow: theme.palette.mode === 'dark' ? `0 24px 64px ${alpha('#000', 0.5)}` : `0 24px 64px ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Stack spacing={3} alignItems="center">
          {/* Brand */}
          <Stack spacing={1.5} alignItems="center">
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
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
              }}
            >
              <HealthAndSafetyIcon sx={{ fontSize: 32 }} />
            </Box>
            <Stack spacing={0.25} alignItems="center">
              <Typography variant="h3" sx={{ fontWeight: 700, letterSpacing: -0.5, fontSize: 24 }}>
                SwasthyaOps
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', fontSize: 10 }}>
                Enterprise AI Command Center
              </Typography>
            </Stack>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', lineHeight: 1.6 }}>
            Sign in with your Google account to access district health intelligence, alerts, and approvals.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', fontSize: 13 }}>
              {error}
            </Alert>
          )}

          {/* Google SSO */}
          <Button
            fullWidth
            size="large"
            variant="outlined"
            onClick={handleGoogleSignIn}
            disabled={busy || loading}
            startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <GoogleGlyph />}
            sx={{
              py: 1.25,
              fontWeight: 600,
              fontSize: 14,
              borderColor: 'divider',
              color: 'text.primary',
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover', borderColor: 'text.secondary' },
            }}
          >
            {busy ? 'Signing in…' : 'Continue with Google'}
          </Button>

          <Divider sx={{ width: '100%' }}>
            <Chip
              size="small"
              icon={<VerifiedUserOutlinedIcon sx={{ fontSize: 13 }} />}
              label="Role-scoped access"
              sx={{ fontSize: 10, fontWeight: 600, height: 20 }}
            />
          </Divider>

          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontSize: 11, lineHeight: 1.5 }}>
            Access is scoped to your district role. All actions are audited per the SwasthyaOps governance policy.
          </Typography>
        </Stack>
      </Card>
    </Box>
  );
}
