'use client';

/**
 * HealthScore — Circular progress gauge with color-coded score and label.
 * Serves as the centerpiece for district and facility health status.
 */
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { status } from '@/theme/tokens';
import AnimatedNumber from './AnimatedNumber';

interface HealthScoreProps {
  score: number;
  size?: number;
  thickness?: number;
  label?: string;
  sublabel?: string;
}

export default function HealthScore({
  score,
  size = 110,
  thickness = 5.5,
  label = 'Health Score',
  sublabel = '/ 100',
}: HealthScoreProps) {
  const theme = useTheme();
  const mode = theme.palette.mode;

  const tone = score < 60 ? 'critical' : score < 80 ? 'high' : 'ok';
  const color = status[tone][mode].fg;
  const trackColor = status[tone][mode].bg;

  return (
    <Stack alignItems="center" spacing={1} sx={{ display: 'inline-flex' }}>
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
        {/* Track circle */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={thickness}
          sx={{
            color: trackColor,
            position: 'absolute',
          }}
        />
        {/* Animated value circle */}
        <CircularProgress
          variant="determinate"
          value={score}
          size={size}
          thickness={thickness}
          sx={{
            color: color,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
              transition: 'stroke-dashoffset 800ms cubic-bezier(0.2, 0, 0, 1)',
            },
          }}
        />
        {/* Inner label */}
        <Stack alignItems="center" justifyContent="center" sx={{ position: 'absolute', zIndex: 1, textAlign: 'center' }}>
          <Stack direction="row" alignItems="baseline" spacing={0.25}>
            <Typography
              variant="h2"
              component="span"
              sx={{
                fontWeight: 700,
                color: color,
                lineHeight: 1,
                fontSize: size > 90 ? 32 : size > 60 ? 20 : 14,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <AnimatedNumber value={score} />
            </Typography>
            {size > 70 && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: size > 90 ? 12 : 10, fontWeight: 600 }}>
                {sublabel}
              </Typography>
            )}
          </Stack>
        </Stack>
      </Box>
      {label && (
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {label}
        </Typography>
      )}
    </Stack>
  );
}
