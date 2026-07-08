'use client';

/**
 * Facility Directory Page — District hospital, CHC, and PHC monitoring grid.
 * Features sticky table headers, multi-column sorting, status indicators, and count filters.
 */
import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTheme, alpha } from '@mui/material/styles';
import { status as statusTokens } from '@/theme/tokens';
import { district, facilities } from '@/lib/demo-data';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StatusDot from '@/components/StatusDot';

const TYPES = ['PHC', 'CHC', 'DH'] as const;
type SortField = 'name' | 'score' | 'doctorsPresent' | 'bedsFree';
type SortOrder = 'asc' | 'desc';

export default function FacilitiesPage() {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<(typeof TYPES)[number] | null>(null);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const rows = useMemo(() => {
    return facilities
      .filter((f) => (typeFilter ? f.type === typeFilter : true))
      .filter((f) => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.block.toLowerCase().includes(q) || f.issue.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        let valA = a[sortField] ?? -1;
        let valB = b[sortField] ?? -1;
        if (typeof valA === 'string') valA = (valA as string).toLowerCase();
        if (typeof valB === 'string') valB = (valB as string).toLowerCase();
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [query, typeFilter, sortField, sortOrder]);

  const scoreColor = (score: number) =>
    statusTokens[score < 50 ? 'critical' : score < 65 ? 'high' : 'ok'][mode].fg;

  const scoreTone = (score: number) =>
    score < 50 ? 'critical' : score < 65 ? 'high' : 'ok';

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto' }}>
      <PageHeader
        title="Facility Health Directory"
        subtitle={`Live operational telemetry across ${district.reporting} of ${district.facilities} district healthcare institutions. Sort by health score to identify critical supply chain and staffing bottlenecks.`}
        badge={<Chip size="small" label={`${facilities.length} Institutions`} color="primary" sx={{ fontWeight: 700 }} />}
      />

      {/* Filter & Search Bar */}
      <Card sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <TextField
            placeholder="Search facility name, block, or active issue..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            size="small"
            sx={{ width: { xs: '100%', md: 360 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mr: 0.5, color: 'text.secondary' }}>
              <FilterListIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                Type:
              </Typography>
            </Stack>

            {TYPES.map((t) => {
              const count = facilities.filter((f) => f.type === t).length;
              return (
                <Chip
                  key={t}
                  label={`${t} (${count})`}
                  size="small"
                  variant={typeFilter === t ? 'filled' : 'outlined'}
                  color={typeFilter === t ? 'primary' : 'default'}
                  onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                  sx={{ fontWeight: 600 }}
                />
              );
            })}
          </Stack>
        </Stack>
      </Card>

      {/* Directory Table */}
      <Card sx={{ bgcolor: 'background.paper' }}>
        {rows.length === 0 ? (
          <EmptyState
            title="No facilities found"
            description="No healthcare institutions match your current search query or institution type filter."
            actionLabel="Clear Filters"
            onAction={() => {
              setTypeFilter(null);
              setQuery('');
            }}
          />
        ) : (
          <TableContainer sx={{ maxHeight: 680, overflowX: 'auto' }}>
            <Table size="medium" stickyHeader aria-label="Facilities health directory">
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={sortField === 'name' ? sortOrder : false}>
                    <TableSortLabel
                      active={sortField === 'name'}
                      direction={sortField === 'name' ? sortOrder : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      Facility & Type
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Block</TableCell>
                  <TableCell align="right" sortDirection={sortField === 'score' ? sortOrder : false}>
                    <TableSortLabel
                      active={sortField === 'score'}
                      direction={sortField === 'score' ? sortOrder : 'asc'}
                      onClick={() => handleSort('score')}
                    >
                      Health Score
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sortDirection={sortField === 'doctorsPresent' ? sortOrder : false}>
                    <TableSortLabel
                      active={sortField === 'doctorsPresent'}
                      direction={sortField === 'doctorsPresent' ? sortOrder : 'asc'}
                      onClick={() => handleSort('doctorsPresent')}
                    >
                      Doctors
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sortDirection={sortField === 'bedsFree' ? sortOrder : false}>
                    <TableSortLabel
                      active={sortField === 'bedsFree'}
                      direction={sortField === 'bedsFree' ? sortOrder : 'asc'}
                      onClick={() => handleSort('bedsFree')}
                    >
                      Beds Free
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Primary Telemetry Issue</TableCell>
                  <TableCell align="center">Telemetry Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((f) => {
                  const tone = scoreTone(f.score);
                  const isCritical = tone === 'critical';

                  return (
                    <TableRow key={f.id} hover sx={{ transition: 'background-color 150ms' }}>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <StatusDot tone={tone} pulse={isCritical} size={8} />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={f.type}
                            sx={{
                              height: 22,
                              fontSize: 11,
                              fontWeight: 700,
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                              borderColor: alpha(theme.palette.primary.main, 0.2),
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {f.name}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {f.block}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-block',
                            px: 1.25,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor: statusTokens[tone][mode].bg,
                            color: statusTokens[tone][mode].fg,
                            fontWeight: 700,
                            fontVariantNumeric: 'tabular-nums',
                            fontSize: 14,
                          }}
                        >
                          {f.score}
                        </Box>
                      </TableCell>

                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {f.doctorsPresent}
                      </TableCell>

                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                        {f.bedsFree ?? (
                          <Typography component="span" variant="caption" color="text.disabled">
                            N/A
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="caption"
                          sx={{
                            color: isCritical ? 'error.main' : 'text.secondary',
                            fontWeight: isCritical ? 600 : 400,
                            display: 'inline-block',
                            bgcolor: isCritical ? alpha(theme.palette.error.main, 0.08) : 'transparent',
                            px: isCritical ? 1 : 0,
                            py: isCritical ? 0.25 : 0,
                            borderRadius: 1,
                          }}
                        >
                          {f.issue}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          size="small"
                          variant={f.reportedToday ? 'outlined' : 'filled'}
                          label={f.reportedToday ? 'Live Today' : 'Stale 3d'}
                          color={f.reportedToday ? 'success' : 'warning'}
                          sx={{ height: 22, fontSize: 10, fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
