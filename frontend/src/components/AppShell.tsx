'use client';

/**
 * App shell: top bar + nav rail (desktop ≥ lg) / bottom bar (below lg) per docs/09 §4.
 * Nav items come from src/lib/nav.ts (single source); active state from the pathname.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { NAV_ITEMS, type NavItem } from '@/lib/nav';
import { district } from '@/lib/demo-data';

const ICONS: Record<NavItem['icon'], typeof SpaceDashboardOutlinedIcon> = {
  dashboard: SpaceDashboardOutlinedIcon,
  alerts: NotificationsNoneIcon,
  approvals: FactCheckOutlinedIcon,
  facilities: LocalHospitalOutlinedIcon,
  briefings: GraphicEqIcon,
  reports: DescriptionOutlinedIcon,
};

function NavLink({ item, active, layout }: { item: NavItem; active: boolean; layout: 'rail' | 'bar' }) {
  const Icon = ICONS[item.icon];
  return (
    <Stack
      component={Link}
      href={item.href}
      aria-current={active ? 'page' : undefined}
      alignItems="center"
      spacing={0.25}
      sx={{
        textDecoration: 'none',
        py: layout === 'rail' ? 0.75 : 0.5,
        px: 0.5,
        flex: layout === 'bar' ? 1 : undefined,
        width: layout === 'rail' ? '100%' : undefined,
        borderRadius: 2,
        '&:hover .nav-pill': { bgcolor: active ? 'primary.main' : 'action.hover' },
      }}
    >
      <Box
        className="nav-pill"
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 44, height: 30, borderRadius: 4,
          bgcolor: active ? 'primary.main' : 'transparent',
          color: active ? 'primary.contrastText' : 'text.secondary',
          transition: 'background-color 120ms',
        }}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Box>
      <Typography variant="caption"
        color={active ? 'text.primary' : 'text.secondary'}
        sx={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>
        {item.short}
      </Typography>
    </Stack>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('lg'));
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {desktop && (
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
          {NAV_ITEMS.map((item) => (
            <Tooltip key={item.href} title={item.label} placement="right">
              <Box sx={{ width: '100%' }}>
                <NavLink item={item} active={isActive(item.href)} layout="rail" />
              </Box>
            </Tooltip>
          ))}
        </Stack>
      )}

      <Box sx={{ flex: 1, minWidth: 0, pb: desktop ? 0 : 9 /* clear the bottom bar */ }}>
        <AppBar position="sticky" color="transparent" elevation={0}
          sx={{ bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', backdropFilter: 'blur(8px)' }}>
          <Toolbar sx={{ gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              SwasthyaOps AI
            </Typography>
            <Chip size="small" variant="outlined" label={`District ${district.name}, ${district.state}`} />
            {desktop && <Chip size="small" color="secondary" variant="outlined" label="Briefing · 07:00 ✓" />}
            <Box sx={{ flex: 1 }} />
            <Chip size="small" label="Demo data — Monsoon Week" color="warning" variant="outlined" />
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>MS</Avatar>
          </Toolbar>
        </AppBar>
        {children}
      </Box>

      {!desktop && (
        <Stack
          component="nav"
          aria-label="Primary"
          direction="row"
          sx={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: (t) => t.zIndex.appBar,
            borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper',
            px: 0.5, pt: 0.5, pb: 'max(4px, env(safe-area-inset-bottom))',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} layout="bar" />
          ))}
        </Stack>
      )}
    </Box>
  );
}
