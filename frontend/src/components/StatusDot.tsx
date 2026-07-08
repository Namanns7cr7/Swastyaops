'use client';

/**
 * StatusDot — 8px semantic indicator dot with optional pulse animation.
 * Follows Google Cloud Console & Material 3 Enterprise status styling.
 */
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { status } from '@/theme/tokens';

export type StatusTone = 'critical' | 'high' | 'ok' | 'stale' | 'info';

interface StatusDotProps {
  tone: StatusTone;
  pulse?: boolean;
  size?: number;
}

export default function StatusDot({ tone, pulse = false, size = 8 }: StatusDotProps) {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const color = status[tone]?.[mode]?.fg || theme.palette.text.secondary;

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: color,
        flexShrink: 0,
        position: 'relative',
        ...(pulse && {
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: '50%',
            border: '2px solid',
            borderColor: color,
            animation: 'status-pulse 1.8s infinite cubic-bezier(0.2, 0, 0, 1)',
          },
          '@keyframes status-pulse': {
            '0%': { transform: 'scale(0.95)', opacity: 0.8 },
            '70%': { transform: 'scale(2.2)', opacity: 0 },
            '100%': { transform: 'scale(0.95)', opacity: 0 },
          },
        }),
      }}
    />
  );
}
