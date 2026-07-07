'use client';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Sparkline from './Sparkline';
import { status } from '@/theme/tokens';
import type { Kpi } from '@/lib/demo-data';

export default function KpiTile({ kpi }: { kpi: Kpi }) {
  const theme = useTheme();
  const mode = theme.palette.mode;
  // Status color only when the state warrants it; neutral tiles stay in ink (docs/09 §2).
  const valueColor =
    kpi.tone === 'critical' ? status.critical[mode].fg :
    kpi.tone === 'high' ? status.high[mode].fg :
    theme.palette.text.primary;
  const sparkColor = kpi.tone === 'ok' ? theme.palette.secondary.main : valueColor;

  return (
    <Card sx={{ p: 2, height: '100%' }}>
      <Typography variant="caption" color="text.secondary" component="div"
        sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {kpi.label}
      </Typography>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ mt: 0.5 }}>
        <Typography variant="h2" component="div"
          sx={{ color: valueColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
          {kpi.value}
        </Typography>
        {kpi.spark && <Sparkline data={kpi.spark} color={sparkColor} />}
      </Stack>
      {kpi.delta && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {kpi.delta}
        </Typography>
      )}
    </Card>
  );
}
