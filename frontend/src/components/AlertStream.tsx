'use client';

/**
 * AlertStream — Live district telemetry feed.
 * Groups alerts chronologically ("Last Hour", "Earlier Today") with severity left-border accents.
 * Replaces hackathon gradient backgrounds with clean Material 3 enterprise surfaces.
 */
import { useState } from 'react';
import Link from 'next/link';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useTheme } from '@mui/material/styles';
import { status } from '@/theme/tokens';
import { alerts as initialAlerts, type Alert } from '@/lib/demo-data';
import SeverityChip from './SeverityChip';
import AlertDetailDrawer from './AlertDetailDrawer';
import EmptyState from './EmptyState';
import StatusDot from './StatusDot';

function ago(minutes: number): string {
  if (minutes < 60) return `${minutes} min ago`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
}

export default function AlertStream() {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const [localAlerts, setLocalAlerts] = useState(initialAlerts);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const openAlerts = localAlerts.filter((a) => a.status !== 'resolved');

  // Chronological grouping
  const lastHour = openAlerts.filter((a) => a.minutesAgo <= 60);
  const earlierToday = openAlerts.filter((a) => a.minutesAgo > 60 && a.minutesAgo <= 1440);
  const older = openAlerts.filter((a) => a.minutesAgo > 1440);

  const groups = [
    { title: 'Last Hour', items: lastHour },
    { title: 'Earlier Today', items: earlierToday },
    { title: 'Older Alerts', items: older },
  ].filter((g) => g.items.length > 0);

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
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Live Alert Stream
            </Typography>
            <StatusDot tone="critical" pulse size={8} />
          </Stack>
        }
        subheader={`${openAlerts.length} open · Real-time BigQuery & Vertex AI telemetry`}
        action={
          <Button
            component={Link}
            href="/alerts"
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
            sx={{ fontWeight: 600, fontSize: 12 }}
          >
            Inbox
          </Button>
        }
        sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}
      />

      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
        {openAlerts.length === 0 ? (
          <EmptyState
            title="District is stable"
            description="No active alerts. All facilities are operating within nominal thresholds."
            actionLabel="View Resolved Archive"
            actionHref="/alerts"
          />
        ) : (
          <Stack spacing={2}>
            {groups.map((group) => (
              <Box key={group.title}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    px: 1,
                    mb: 0.75,
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {group.title} ({group.items.length})
                </Typography>

                <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {group.items.map((alert) => {
                    const borderColor = getSeverityColor(alert.severity);
                    const isCritical = alert.severity === 'critical';

                    return (
                      <ListItemButton
                        key={alert.id}
                        onClick={() => setSelectedAlert(alert)}
                        sx={{
                          borderRadius: 2,
                          alignItems: 'flex-start',
                          gap: 1.5,
                          p: 1.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderLeft: '4px solid',
                          borderLeftColor: borderColor,
                          bgcolor: 'background.default',
                          transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            transform: 'translateX(4px)',
                            borderColor: borderColor,
                          },
                        }}
                      >
                        <Box sx={{ mt: 0.25 }}>
                          <SeverityChip severity={alert.severity} />
                        </Box>

                        <Stack sx={{ minWidth: 0, flex: 1, spacing: 0.25 }}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {alert.title}
                            </Typography>
                            {alert.status === 'acknowledged' && (
                              <Chip size="small" label="Ack" color="info" variant="outlined" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />
                            )}
                          </Stack>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11 }}>
                            {alert.facility} · {ago(alert.minutesAgo)} · {alert.source}
                          </Typography>
                        </Stack>
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <AlertDetailDrawer
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onStatusChange={handleStatusChange}
      />
    </Card>
  );
}
