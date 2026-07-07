'use client';

/**
 * S2 shell: top bar + nav rail (desktop ≥1240) / bottom bar (mobile) per docs/09 §4.
 * Nav targets map to the screen inventory (docs/08 §2); only S2 is live pre-Sprint 7.
 */
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { district } from '@/lib/demo-data';

const nav = [
  { label: 'Command Center', Icon: SpaceDashboardOutlinedIcon, active: true },
  { label: 'Alerts', Icon: NotificationsNoneIcon, active: false },
  { label: 'Approvals', Icon: FactCheckOutlinedIcon, active: false },
  { label: 'Facilities', Icon: LocalHospitalOutlinedIcon, active: false },
  { label: 'Briefings', Icon: GraphicEqIcon, active: false },
  { label: 'Reports', Icon: DescriptionOutlinedIcon, active: false },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('lg'));

  const rail = (
    <Stack
      component="nav"
      aria-label="Primary"
      spacing={0.5}
      sx={{
        width: 84, py: 2, px: 1, alignItems: 'center', flexShrink: 0,
        borderRight: 1, borderColor: 'divider', bgcolor: 'background.paper',
        position: 'sticky', top: 0, height: '100vh',
      }}
    >
      {nav.map(({ label, Icon, active }) => (
        <Tooltip key={label} title={label} placement="right">
          <Stack alignItems="center" spacing={0.25} sx={{ width: '100%', py: 0.75 }}>
            <IconButton
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              sx={{
                bgcolor: active ? 'primary.main' : 'transparent',
                color: active ? 'primary.contrastText' : 'text.secondary',
                '&:hover': { bgcolor: active ? 'primary.main' : 'action.hover' },
              }}
            >
              <Icon fontSize="small" />
            </IconButton>
            <Typography variant="caption" color={active ? 'text.primary' : 'text.secondary'}
              sx={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>
              {label.split(' ')[0]}
            </Typography>
          </Stack>
        </Tooltip>
      ))}
    </Stack>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {desktop && rail}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <AppBar position="sticky" color="transparent" elevation={0}
          sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', backdropFilter: 'blur(8px)' }}>
          <Toolbar sx={{ gap: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              SwasthyaOps AI
            </Typography>
            <Chip size="small" variant="outlined"
              label={`District ${district.name}, ${district.state}`} />
            <Chip size="small" color="secondary" variant="outlined" label="Briefing · 07:00 ✓" />
            <Box sx={{ flex: 1 }} />
            <Chip size="small" label="Demo data — Monsoon Week" color="warning" variant="outlined" />
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>MS</Avatar>
          </Toolbar>
        </AppBar>
        {children}
      </Box>
    </Box>
  );
}
