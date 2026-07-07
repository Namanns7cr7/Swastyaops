'use client';

/**
 * S7 — Facility directory (docs/08 §2): search + type filter, worst score first.
 * Facility 360 drill-down (90-day trends) lands in Sprint 7.
 */
import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import { status as statusTokens } from '@/theme/tokens';
import { district, facilities } from '@/lib/demo-data';

const TYPES = ['PHC', 'CHC', 'DH'] as const;

export default function FacilitiesPage() {
  const mode = useTheme().palette.mode;
  const [query, setQuery] = useState('');
  const [type, setType] = useState<(typeof TYPES)[number] | null>(null);

  const rows = useMemo(
    () => facilities
      .filter((f) => (type ? f.type === type : true))
      .filter((f) => f.name.toLowerCase().includes(query.toLowerCase()) || f.block.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.score - b.score),
    [query, type],
  );

  const scoreColor = (score: number) =>
    statusTokens[score < 50 ? 'critical' : score < 65 ? 'high' : 'ok'][mode].fg;

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 3 }, display: 'grid', gap: 2 }}>
      <Stack direction="row" alignItems="baseline" spacing={1.5} flexWrap="wrap">
        <Typography variant="h3">Facilities</Typography>
        <Typography variant="body2" color="text.secondary">
          {district.reporting} of {district.facilities} reporting today · directory shows the {facilities.length} seeded demo facilities
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
        <TextField size="small" placeholder="Search name or block…" value={query}
          onChange={(e) => setQuery(e.target.value)} sx={{ minWidth: 240 }} />
        {TYPES.map((t) => (
          <Chip key={t} label={t} size="small" variant={type === t ? 'filled' : 'outlined'}
            color={type === t ? 'primary' : 'default'}
            onClick={() => setType(type === t ? null : t)} />
        ))}
      </Stack>

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Facilities, worst health score first">
            <TableHead>
              <TableRow>
                <TableCell>Facility</TableCell>
                <TableCell>Block</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="right">Doctors</TableCell>
                <TableCell align="right">Beds free</TableCell>
                <TableCell>Attention</TableCell>
                <TableCell>Reported</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((f) => (
                <TableRow key={f.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" variant="outlined" label={f.type} sx={{ height: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{f.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{f.block}</Typography></TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ color: scoreColor(f.score), fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {f.score}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{f.doctorsPresent}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{f.bedsFree ?? '—'}</TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{f.issue}</Typography></TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined"
                      label={f.reportedToday ? 'Today' : 'Stale 3d'}
                      sx={f.reportedToday ? undefined : {
                        color: statusTokens.stale[mode].fg, bgcolor: statusTokens.stale[mode].bg,
                      }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
