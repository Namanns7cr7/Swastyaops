'use client';

/**
 * Alert Inbox Page — Enterprise anomaly investigation and triage.
 * Features text search, count-badge filters, severity left accents, and Recharts drill-down drawer.
 */
import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTheme } from '@mui/material/styles';
import SeverityChip from '@/components/SeverityChip';
import AlertDetailDrawer from '@/components/AlertDetailDrawer';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StatusDot from '@/components/StatusDot';
import { status } from '@/theme/tokens';
import { alerts, type AlertStatus, type Severity, type Alert } from '@/lib/demo-data';

const STATUS_LABEL: Record<AlertStatus, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};
const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];

function ago(minutes: number): string {
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h ago`;
  return `${Math.floor(minutes / 1440)} d ago`;
}

export default function AlertsPage() {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const [localAlerts, setLocalAlerts] = useState(alerts);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | null>(null);
  const [statusFilter, setStatusFilter] = useState<AlertStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return localAlerts
      .filter((a) => (severityFilter ? a.severity === severityFilter : true))
      .filter((a) => (statusFilter ? a.status === statusFilter : true))
      .filter((a) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.facility.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q)
        );
      });
  }, [localAlerts, severityFilter, statusFilter, searchQuery]);

  const handleStatusChange = (id: string, newStatus: Alert['status']) => {
    setLocalAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    if (selectedAlert && selectedAlert.id === id) {
      setSelectedAlert((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const getSeverityColor = (sev: Alert['severity']) => {
    const tone = sev === 'medium' ? 'stale' : sev === 'low' ? 'stale' : sev;
    return status[tone]?.[mode]?.fg || theme.palette.text.secondary;
  };

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto' }}>
      <PageHeader
        title="Alert Inbox & Triage"
        subtitle="Real-time telemetry streams from district PHCs, CHCs, and EDL inventory checkpoints. Click any alert to inspect ARIMA_PLUS stock projections and AI reasoning."
        badge={<Chip size="small" label={`${localAlerts.filter((a) => a.status !== 'resolved').length} Open`} color="error" sx={{ fontWeight: 700 }} />}
      />

      {/* Filter & Search Bar */}
      <Card sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          {/* Search Box */}
          <TextField
            placeholder="Search alerts by facility, title, or AI agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Severity & Status Filter Chips */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mr: 0.5, color: 'text.secondary' }}>
              <FilterListIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                Filters:
              </Typography>
            </Stack>

            {SEVERITIES.map((s) => {
              const count = localAlerts.filter((a) => a.severity === s).length;
              return (
                <Chip
                  key={s}
                  label={`${s.charAt(0).toUpperCase() + s.slice(1)} (${count})`}
                  size="small"
                  variant={severityFilter === s ? 'filled' : 'outlined'}
                  color={severityFilter === s ? (s === 'critical' ? 'error' : s === 'high' ? 'warning' : 'primary') : 'default'}
                  onClick={() => setSeverityFilter(severityFilter === s ? null : s)}
                  sx={{ fontWeight: 600 }}
                />
              );
            })}

            <Box sx={{ width: 1, height: 20, bgcolor: 'divider', mx: 0.5, display: { xs: 'none', sm: 'block' } }} />

            {(Object.keys(STATUS_LABEL) as AlertStatus[]).map((s) => {
              const count = localAlerts.filter((a) => a.status === s).length;
              return (
                <Chip
                  key={s}
                  label={`${STATUS_LABEL[s]} (${count})`}
                  size="small"
                  variant={statusFilter === s ? 'filled' : 'outlined'}
                  color={statusFilter === s ? 'secondary' : 'default'}
                  onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                  sx={{ fontWeight: 500 }}
                />
              );
            })}
          </Stack>
        </Stack>
      </Card>

      {/* Alert List Container */}
      <Card sx={{ p: 1.5, bgcolor: 'background.paper' }}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No matching alerts"
            description="No telemetry anomalies match your active search or severity filters."
            actionLabel="Reset Filters"
            onAction={() => {
              setSeverityFilter(null);
              setStatusFilter(null);
              setSearchQuery('');
            }}
          />
        ) : (
          <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filtered.map((alert) => {
              const borderColor = getSeverityColor(alert.severity);
              const isResolved = alert.status === 'resolved';

              return (
                <ListItemButton
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  sx={{
                    borderRadius: 2,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderLeft: '4px solid',
                    borderLeftColor: borderColor,
                    bgcolor: isResolved ? 'action.hover' : 'background.default',
                    opacity: isResolved ? 0.75 : 1,
                    transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'translateX(4px)',
                      borderColor: borderColor,
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0, flex: 1 }}>
                    <Stack alignItems="center" spacing={0.5} sx={{ width: 90, flexShrink: 0 }}>
                      <SeverityChip severity={alert.severity} />
                      {alert.severity === 'critical' && !isResolved && <StatusDot tone="critical" pulse size={6} />}
                    </Stack>

                    <Stack sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: isResolved ? 'text.secondary' : 'text.primary' }}>
                        {alert.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 12 }}>
                        {alert.facility} · Reported {ago(alert.minutesAgo)} · Detected by <Box component="span" sx={{ fontWeight: 600 }}>{alert.source}</Box>
                      </Typography>
                    </Stack>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1.5} flexShrink={0}>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={STATUS_LABEL[alert.status]}
                      color={isResolved ? 'success' : alert.status === 'acknowledged' ? 'info' : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Card>

      <AlertDetailDrawer
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onStatusChange={handleStatusChange}
      />
    </Box>
  );
}
