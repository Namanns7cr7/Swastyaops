'use client';

/**
 * Worst-first facility list — stands in for the Google Map panel until the Maps key
 * is configured (S2; map lands per docs/11 Sprint 7). Score bar is a single-hue
 * magnitude encoding; the issue text carries the identity, not the color.
 */
import Link from 'next/link';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import { useTheme } from '@mui/material/styles';
import { status } from '@/theme/tokens';
import { district, facilityRisks } from '@/lib/demo-data';

export default function FacilityRiskList() {
  const mode = useTheme().palette.mode;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={<Typography variant="subtitle1">Facilities — worst first</Typography>}
        subheader={`${district.reporting} of ${district.facilities} reporting today · district map lands with the Maps key`}
        action={<Chip component={Link} href="/facilities" clickable size="small" label="Directory" variant="outlined" />}
        sx={{ pb: 0 }}
      />
      <Stack spacing={1.25} sx={{ p: 2 }}>
        {facilityRisks.map((f) => {
          const tone = f.score < 50 ? 'critical' : f.score < 65 ? 'high' : 'ok';
          const barColor = status[tone][mode].fg;
          return (
            <Box key={f.id}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Chip size="small" variant="outlined" label={f.type} sx={{ height: 20 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{f.name}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{f.block}</Typography>
                </Stack>
                <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {f.score}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={f.score}
                aria-label={`${f.name} health score ${f.score} of 100`}
                sx={{
                  mt: 0.5, height: 6, borderRadius: 3,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': { bgcolor: barColor, borderRadius: 3 },
                }}
              />
              <Typography variant="caption" color="text.secondary">{f.issue}</Typography>
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}
