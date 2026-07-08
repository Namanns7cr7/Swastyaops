'use client';

/**
 * AlertDetailDrawer — Enterprise drill-down panel for AI anomaly investigation.
 * Features Recharts ARIMA_PLUS predictive stock forecast, timeline telemetry, and AI provenance.
 */
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useTheme, alpha } from '@mui/material/styles';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from 'recharts';
import SeverityChip from './SeverityChip';
import type { Alert } from '@/lib/demo-data';

interface AlertDetailDrawerProps {
  alert: Alert | null;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: Alert['status']) => void;
}

const FORECAST_DATA = [
  { day: 'Day -14', actual: 120, p90: 125, p10: 115 },
  { day: 'Day -10', actual: 102, p90: 108, p10: 96 },
  { day: 'Day -7', actual: 85, p90: 92, p10: 78 },
  { day: 'Day -3', actual: 64, p90: 72, p10: 56 },
  { day: 'Today', actual: 48, forecast: 48, p90: 56, p10: 40 },
  { day: 'Day +3', forecast: 34, p90: 46, p10: 22 },
  { day: 'Day +6 (Breach)', forecast: 21, p90: 34, p10: 12 },
  { day: 'Day +10', forecast: 14, p90: 28, p10: 6 },
];

export default function AlertDetailDrawer({ alert, onClose, onStatusChange }: AlertDetailDrawerProps) {
  const theme = useTheme();

  if (!alert) return null;

  const isResolved = alert.status === 'resolved';
  const isAcknowledged = alert.status === 'acknowledged';

  return (
    <Drawer
      anchor="right"
      open={!!alert}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 520 },
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box sx={{ overflowY: 'auto', pr: 0.5 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Stack spacing={0.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                AI Anomaly Investigation
              </Typography>
              <Chip size="small" label={`ID: ${alert.id}`} sx={{ height: 18, fontSize: 10, fontWeight: 600 }} />
            </Stack>
            <Typography variant="h3" sx={{ fontWeight: 700, pr: 2, fontSize: 22 }}>
              {alert.title}
            </Typography>
          </Stack>
          <IconButton onClick={onClose} edge="end" aria-label="close drawer" size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <SeverityChip severity={alert.severity} />
          <Chip
            label={`Status: ${alert.status.replace('_', ' ')}`}
            size="small"
            color={isResolved ? 'success' : isAcknowledged ? 'info' : 'default'}
            sx={{ fontWeight: 600, textTransform: 'capitalize' }}
          />
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Telemetry Key-Value Grid */}
        <Grid container spacing={2} sx={{ mb: 3, bgcolor: 'background.default', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
              TARGET FACILITY
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {alert.facility}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
              DETECTION SOURCE
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {alert.source}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
              TIME elapsed
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {alert.minutesAgo} minutes ago
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
              ACTION REQUIRED
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              CMO Sign-off / Indent
            </Typography>
          </Grid>
        </Grid>

        {/* Evidence Panel with Recharts Forecast Curve */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" justify-content="space-between" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Predictive Stock Telemetry
            </Typography>
            <Chip size="small" icon={<AutoAwesomeIcon sx={{ fontSize: 12 }} />} label="ARIMA_PLUS Model" color="primary" variant="outlined" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: 13, lineHeight: 1.5 }}>
            BigQuery ML 14-day stock burn trajectory. Shaded band represents P10–P90 confidence boundaries. Safety cover breach projected in 6 days without intervention.
          </Typography>

          {/* Recharts Container */}
          <Box sx={{ height: 200, width: '100%', bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, pt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={FORECAST_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pBoundGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: theme.palette.text.secondary }} stroke={theme.palette.divider} />
                <YAxis tick={{ fontSize: 10, fill: theme.palette.text.secondary }} stroke={theme.palette.divider} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    borderColor: theme.palette.divider,
                    borderRadius: 8,
                    fontSize: 12,
                    boxShadow: theme.shadows[3],
                  }}
                />
                <ReferenceLine y={25} stroke={theme.palette.error.main} strokeDasharray="4 4" label={{ value: 'Safety Cover (25)', fill: theme.palette.error.main, fontSize: 10, position: 'top' }} />
                
                {/* Confidence Interval Band */}
                <Area type="monotone" dataKey="p90" stroke="none" fill="url(#pBoundGradient)" />
                <Area type="monotone" dataKey="p10" stroke="none" fill={theme.palette.background.default} />

                {/* Actual Historical Line */}
                <Line type="monotone" dataKey="actual" stroke={theme.palette.primary.main} strokeWidth={3} dot={{ r: 4, fill: theme.palette.primary.main }} name="Actual Stock" />
                
                {/* Forecast Line */}
                <Line type="monotone" dataKey="forecast" stroke={theme.palette.warning.main} strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: theme.palette.warning.main }} name="AI Forecast" />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Provenance Box */}
        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <AutoAwesomeIcon sx={{ fontSize: 14, color: 'primary.main' }} />
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              VERTEX AI PROVENANCE & REASONING
            </Typography>
          </Stack>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Pipeline Run ID
              </Typography>
              <code style={{ fontSize: 11, fontWeight: 600, color: theme.palette.text.primary }}>run_bqml_{alert.id.slice(-4)}</code>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Inference Engine
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Gemini 2.5 Pro · 94% Conf.
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Drawer Action Buttons */}
      <Stack direction="row" spacing={1.5} sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        {!isAcknowledged && !isResolved && (
          <Button
            variant="outlined"
            fullWidth
            onClick={() => onStatusChange(alert.id, 'acknowledged')}
            sx={{ fontWeight: 600 }}
          >
            Acknowledge
          </Button>
        )}
        {!isResolved && (
          <Button
            variant="contained"
            fullWidth
            color="success"
            onClick={() => onStatusChange(alert.id, 'resolved')}
            startIcon={<CheckCircleOutlineIcon />}
            sx={{ fontWeight: 600 }}
          >
            Resolve Alert
          </Button>
        )}
        {isResolved && (
          <Box sx={{ textAlign: 'center', width: '100%', py: 1, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
              ✓ Alert Resolved & Archived
            </Typography>
          </Box>
        )}
      </Stack>
    </Drawer>
  );
}
