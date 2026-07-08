'use client';

/**
 * FacilityRiskList — Worst-first facility monitoring panel.
 * Stands in for the Google Map panel until the Maps key is configured (docs/11 Sprint 7).
 * Features gradient health bars, mini trend sparklines, and status indicators.
 */
import Link from 'next/link';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTheme } from '@mui/material/styles';
import { status } from '@/theme/tokens';
import { district, facilityRisks } from '@/lib/demo-data';
import StatusDot from './StatusDot';
import Sparkline from './Sparkline';
import EmptyState from './EmptyState';

export default function FacilityRiskList() {
  const theme = useTheme();
  const mode = theme.palette.mode;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Facility Risk Watch
            </Typography>
            <Chip size="small" label={`${facilityRisks.length} critical`} color="error" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
          </Stack>
        }
        subheader={`${district.reporting} of ${district.facilities} reporting today · Live AI telemetry`}
        action={
          <Button
            component={Link}
            href="/facilities"
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
            sx={{ fontWeight: 600, fontSize: 12 }}
          >
            Directory
          </Button>
        }
        sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}
      />

      <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
        {facilityRisks.length === 0 ? (
          <EmptyState
            title="All facilities stable"
            description="No healthcare facilities are currently breaching district risk thresholds."
            actionLabel="View Directory"
            actionHref="/facilities"
          />
        ) : (
          <Stack spacing={2}>
            {facilityRisks.map((f, i) => {
              const tone = f.score < 50 ? 'critical' : f.score < 65 ? 'high' : 'ok';
              const barColor = status[tone][mode].fg;
              const trackColor = status[tone][mode].bg;

              // Generate deterministic 7-day deteriorating trend for risk visualization
              const trend = [
                Math.min(100, f.score + 18),
                Math.min(100, f.score + 14),
                Math.min(100, f.score + 15),
                Math.min(100, f.score + 9),
                Math.min(100, f.score + 6),
                Math.min(100, f.score + 2),
                f.score,
              ];

              return (
                <Box
                  key={f.id}
                  component={Link}
                  href="/facilities"
                  sx={{
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                    transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderColor: barColor,
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                      <StatusDot tone={tone} pulse={tone === 'critical'} size={8} />
                      <Chip size="small" label={f.type} sx={{ height: 20, fontSize: 10, fontWeight: 700, bgcolor: 'action.selected' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {f.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        · {f.block}
                      </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={1.5} flexShrink={0}>
                      <Box sx={{ width: 64, display: { xs: 'none', sm: 'block' } }}>
                        <Sparkline data={trend} color={barColor} width={64} height={20} />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: barColor,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                          minWidth: 28,
                          textAlign: 'right',
                        }}
                      >
                        {f.score}
                      </Typography>
                    </Stack>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={f.score}
                    aria-label={`${f.name} health score ${f.score} of 100`}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: trackColor,
                      mb: 1,
                      '& .MuiLinearProgress-bar': {
                        bgcolor: barColor,
                        borderRadius: 3,
                      },
                    }}
                  />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: 11 }}>
                      {f.issue}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>
                      #{i + 1} priority
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Card>
  );
}
