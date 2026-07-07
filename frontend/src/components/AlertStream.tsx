'use client';

/**
 * S2 live alert stream (docs/08 §3). Demo data now; becomes a Firestore listener on
 * alerts (district-scoped, newest first) in Sprint 7. New items must never reflow
 * under the cursor — a "N new" pill handles inserts when scrolled (docs/09 §5).
 */
import Link from 'next/link';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import SeverityChip from './SeverityChip';
import { alerts } from '@/lib/demo-data';

function ago(minutes: number): string {
  if (minutes < 60) return `${minutes} min ago`;
  const h = Math.floor(minutes / 60);
  return `${h} h ago`;
}

export default function AlertStream() {
  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardHeader
        title={<Typography variant="subtitle1">Alert stream</Typography>}
        subheader={`${alerts.filter((a) => a.status !== 'resolved').length} open · live`}
        action={<Chip component={Link} href="/alerts" clickable size="small" label="View inbox" variant="outlined" />}
        sx={{ pb: 0 }}
      />
      <List sx={{ overflowY: 'auto', px: 1 }} aria-label="Open alerts, newest first">
        {alerts.filter((a) => a.status !== 'resolved').map((alert) => (
          <ListItemButton key={alert.id} sx={{ borderRadius: 2, alignItems: 'flex-start', gap: 1.5, py: 1.25 }}>
            <SeverityChip severity={alert.severity} />
            <Stack sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {alert.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {alert.facility} · {ago(alert.minutesAgo)} · {alert.source}
              </Typography>
            </Stack>
          </ListItemButton>
        ))}
      </List>
    </Card>
  );
}
