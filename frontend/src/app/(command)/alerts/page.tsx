'use client';

/**
 * S3 — Alert Inbox (docs/08 §2): filter by severity and status, newest first.
 */
import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import SeverityChip from '@/components/SeverityChip';
import { alerts, type AlertStatus, type Severity } from '@/lib/demo-data';

const STATUS_LABEL: Record<AlertStatus, string> = {
  open: 'Open', acknowledged: 'Acknowledged', in_progress: 'In progress', resolved: 'Resolved',
};
const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];

function ago(minutes: number): string {
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h ago`;
  return `${Math.floor(minutes / 1440)} d ago`;
}

export default function AlertsPage() {
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [status, setStatus] = useState<AlertStatus | null>(null);

  const filtered = useMemo(
    () => alerts
      .filter((a) => (severity ? a.severity === severity : true))
      .filter((a) => (status ? a.status === status : true)),
    [severity, status],
  );

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 3 }, display: 'grid', gap: 2 }}>
      <Stack direction="row" alignItems="baseline" spacing={1.5} flexWrap="wrap">
        <Typography variant="h3">Alert inbox</Typography>
        <Typography variant="body2" color="text.secondary">
          {filtered.length} of {alerts.length} · bulk acknowledge lands with the live API
        </Typography>
      </Stack>

      {/* One filter row above the list (docs/09 §5) */}
      <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
        {SEVERITIES.map((s) => (
          <Chip key={s} label={s} size="small" variant={severity === s ? 'filled' : 'outlined'}
            color={severity === s ? 'primary' : 'default'}
            onClick={() => setSeverity(severity === s ? null : s)} />
        ))}
        <Box sx={{ width: 8 }} />
        {(Object.keys(STATUS_LABEL) as AlertStatus[]).map((s) => (
          <Chip key={s} label={STATUS_LABEL[s]} size="small" variant={status === s ? 'filled' : 'outlined'}
            color={status === s ? 'secondary' : 'default'}
            onClick={() => setStatus(status === s ? null : s)} />
        ))}
      </Stack>

      <Card>
        <List aria-label="Alerts, newest first" sx={{ px: 1 }}>
          {filtered.map((alert) => (
            <ListItemButton key={alert.id} sx={{ borderRadius: 2, alignItems: 'flex-start', gap: 1.5, py: 1.5 }}>
              <SeverityChip severity={alert.severity} />
              <Stack sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{alert.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {alert.facility} · {ago(alert.minutesAgo)} · {alert.source}
                </Typography>
              </Stack>
              <Chip size="small" variant="outlined" label={STATUS_LABEL[alert.status]} />
            </ListItemButton>
          ))}
          {filtered.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
              No alerts match these filters.
            </Typography>
          )}
        </List>
      </Card>
    </Box>
  );
}
