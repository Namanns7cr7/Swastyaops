'use client';

/**
 * KpiTile — Reusable metric card with Google Cloud Console / Looker Studio enterprise styling.
 * Features tinted icon container, animated number counting, trend arrows, and sparkline.
 */
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MedicalInformationOutlinedIcon from '@mui/icons-material/MedicalInformationOutlined';
import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useTheme, alpha } from '@mui/material/styles';
import Sparkline from './Sparkline';
import AnimatedNumber from './AnimatedNumber';
import { status } from '@/theme/tokens';
import type { Kpi } from '@/lib/demo-data';

const KPI_ICONS: Record<string, typeof ErrorOutlineIcon> = {
  'Open criticals': ErrorOutlineIcon,
  'Stock-risk facilities': WarningAmberIcon,
  'Doctors present': MedicalInformationOutlinedIcon,
  'Beds available': BedOutlinedIcon,
  'Labs down': BiotechOutlinedIcon,
  'Facilities reporting': FactCheckOutlinedIcon,
};

export default function KpiTile({ kpi }: { kpi: Kpi }) {
  const theme = useTheme();
  const mode = theme.palette.mode;

  // Resolve semantic color tone
  const toneColor =
    kpi.tone === 'critical' ? status.critical[mode].fg :
    kpi.tone === 'high' ? status.high[mode].fg :
    kpi.tone === 'ok' ? status.ok[mode].fg :
    theme.palette.primary.main;

  const bgTint =
    kpi.tone === 'critical' ? status.critical[mode].bg :
    kpi.tone === 'high' ? status.high[mode].bg :
    kpi.tone === 'ok' ? status.ok[mode].bg :
    alpha(theme.palette.primary.main, 0.08);

  const Icon = KPI_ICONS[kpi.label] || FactCheckOutlinedIcon;

  // Determine trend direction from delta string
  const isUp = kpi.delta?.includes('+') || kpi.delta?.includes('up') || kpi.tone === 'ok';
  const isDown = kpi.delta?.includes('-') || kpi.delta?.includes('down') || kpi.tone === 'critical' || kpi.tone === 'high';

  return (
    <Card
      sx={{
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 250ms cubic-bezier(0.2, 0, 0, 1)',
        '&:hover': {
          boxShadow: theme.shadows[4],
          borderColor: toneColor,
        },
      }}
    >
      {/* Top row: Icon container + Label */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            fontSize: 11,
            lineHeight: 1.3,
          }}
        >
          {kpi.label}
        </Typography>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: bgTint,
            color: toneColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Box>
      </Stack>

      {/* Middle row: Large Value + Sparkline */}
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" spacing={1} sx={{ my: 0.5 }}>
        <Typography
          variant="h2"
          component="div"
          sx={{
            color: kpi.tone === 'neutral' ? 'text.primary' : toneColor,
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 700,
            lineHeight: 1.1,
            fontSize: { xs: 26, lg: 28 },
          }}
        >
          <AnimatedNumber value={kpi.value} />
        </Typography>
        {kpi.spark && (
          <Box sx={{ pb: 0.5 }}>
            <Sparkline data={kpi.spark} color={toneColor} width={88} height={28} />
          </Box>
        )}
      </Stack>

      {/* Bottom row: Delta trend */}
      {kpi.delta && (
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
          {isUp ? (
            <TrendingUpIcon sx={{ fontSize: 14, color: kpi.tone === 'ok' ? 'success.main' : 'warning.main' }} />
          ) : isDown ? (
            <TrendingDownIcon sx={{ fontSize: 14, color: kpi.tone === 'critical' ? 'error.main' : 'warning.main' }} />
          ) : null}
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: 11 }}>
            {kpi.delta}
          </Typography>
        </Stack>
      )}
    </Card>
  );
}
