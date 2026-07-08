'use client';

/**
 * AI Command Center Dashboard — The operational centerpiece of SwasthyaOps AI.
 * Follows Google Cloud Console & Looker Studio enterprise hierarchy:
 * 1. Hero Status Bar (District Health Score & AI Summary)
 * 2. Primary Metric Tiles (KPI Grid)
 * 3. Live Intelligence Feed (Facility Risk & Alert Stream)
 * 4. Human-in-the-Loop Decision Sign-off (Approval Queue)
 */
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import { useTheme, alpha } from '@mui/material/styles';
import KpiTile from '@/components/KpiTile';
import AlertStream from '@/components/AlertStream';
import ApprovalQueue from '@/components/ApprovalQueue';
import FacilityRiskList from '@/components/FacilityRiskList';
import HealthScore from '@/components/HealthScore';
import AISummaryCard from '@/components/AISummaryCard';
import StatusDot from '@/components/StatusDot';
import { kpis, district, alerts, approvals } from '@/lib/demo-data';

export default function CommandCenterPage() {
  const theme = useTheme();

  const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length;
  const highCount = alerts.filter((a) => a.severity === 'high' && a.status !== 'resolved').length;

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 1600, mx: 'auto' }}>
      {/* ── Section 1: Hero Status Bar & AI Summary ── */}
      <Card
        sx={{
          p: { xs: 2.5, md: 3 },
          bgcolor: 'background.paper',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Left: District Health Gauge */}
          <Grid item xs={12} sm={4} md={3} sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' }, borderRight: { sm: '1px solid' }, borderColor: { sm: 'divider' } }}>
            <Stack direction="row" spacing={2.5} alignItems="center">
              <HealthScore score={74} size={100} thickness={5} label="District Score" />
              <Stack spacing={0.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <StatusDot tone="high" pulse size={10} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                    Monsoon Watch
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                  {district.reporting} / {district.facilities} facilities online
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ pt: 0.5 }}>
                  <Chip size="small" label={`${criticalCount} Critical`} color="error" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
                  <Chip size="small" label={`${highCount} High`} color="warning" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
                </Stack>
              </Stack>
            </Stack>
          </Grid>

          {/* Center/Right: AI Summary & Environment Telemetry */}
          <Grid item xs={12} sm={8} md={9}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Executive Telemetry Feed
                  </Typography>
                  <Chip size="small" variant="outlined" label="Live Telemetry" sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: 'background.default' }} />
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Chip
                    size="small"
                    icon={<WbSunnyOutlinedIcon sx={{ fontSize: 14 }} />}
                    label="34°C · Sikar Monsoon Onset"
                    variant="outlined"
                    sx={{ height: 24, fontSize: 11, fontWeight: 500, bgcolor: 'background.default' }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, display: { xs: 'none', sm: 'block' } }}>
                    Updated just now
                  </Typography>
                </Stack>
              </Stack>

              <AISummaryCard
                title="Real-Time AI District Evaluation"
                confidence="94%"
                agent="Executive Briefing Agent"
                summary="District health score is at 74 (−2 vs yesterday), primarily driven by an emerging diarrheal footfall cluster (+38%) across 3 catchments in Ringas block. ORS inventory at PHC Losal is projected to breach safety thresholds in 6 days. Immediate approval of Recommendation rec_9f2 is advised to rebalance stock."
                action={
                  <Button
                    component={Link}
                    href="/briefings"
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    sx={{ fontWeight: 600, fontSize: 11 }}
                  >
                    Full Briefing
                  </Button>
                }
              />
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* ── Section 2: Primary KPI Grid ── */}
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, px: 0.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 15 }}>
            Key Performance Indicators
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            14-day rolling telemetry · Click any tile for historical drill-down
          </Typography>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(6, 1fr)' },
          }}
        >
          {kpis.map((kpi) => (
            <KpiTile key={kpi.label} kpi={kpi} />
          ))}
        </Box>
      </Box>

      {/* ── Section 3: Live Intelligence Feed (Two-Column Layout) ── */}
      <Box
        sx={{
          display: 'grid',
          gap: 2.5,
          gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' },
          alignItems: 'stretch',
        }}
      >
        <FacilityRiskList />
        <AlertStream />
      </Box>

      {/* ── Section 4: Human-in-the-Loop Decisions Panel ── */}
      <Box>
        <ApprovalQueue />
      </Box>
    </Box>
  );
}
