'use client';

/**
 * App shell: Collapsible enterprise sidebar (desktop ≥ lg) / bottom bar (below lg) + clean top bar.
 * Follows Google Cloud Console & Material 3 Enterprise navigation patterns.
 */
import { useState } from 'react';
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
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import InputBase from '@mui/material/InputBase';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, alpha } from '@mui/material/styles';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import { NAV_ITEMS, type NavItem } from '@/lib/nav';
import { district, alerts, approvals } from '@/lib/demo-data';
import { sidebar } from '@/theme/tokens';
import Breadcrumbs from './Breadcrumbs';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import { useRouter } from 'next/navigation';
import { useColorMode } from '@/app/providers';
import { useAuth } from '@/lib/auth';

const ICONS: Record<NavItem['icon'], typeof SpaceDashboardOutlinedIcon> = {
  dashboard: SpaceDashboardOutlinedIcon,
  alerts: NotificationsNoneOutlinedIcon,
  approvals: FactCheckOutlinedIcon,
  facilities: LocalHospitalOutlinedIcon,
  briefings: GraphicEqIcon,
  reports: DescriptionOutlinedIcon,
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const { mode, toggleColorMode } = useColorMode();
  const { user, signOutUser } = useAuth();
  const router = useRouter();
  const desktop = useMediaQuery(theme.breakpoints.up('lg'));
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<HTMLElement | null>(null);

  const displayName = user?.displayName ?? 'Signed in';
  const email = user?.email ?? '';
  const initials =
    user?.displayName
      ?.split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? 'U';

  const handleSignOut = async () => {
    setProfileAnchor(null);
    await signOutUser();
    router.replace('/login');
  };

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  // Dynamic badge counts from demo data
  const openAlertsCount = alerts.filter((a) => a.status !== 'resolved').length;
  const pendingApprovalsCount = approvals.length;

  const getBadgeCount = (icon: NavItem['icon']) => {
    if (icon === 'alerts') return openAlertsCount;
    if (icon === 'approvals') return pendingApprovalsCount;
    return 0;
  };

  const navGroups = [
    {
      title: 'Operations',
      items: NAV_ITEMS.filter((i) => ['dashboard', 'alerts', 'approvals'].includes(i.icon)),
    },
    {
      title: 'Intelligence',
      items: NAV_ITEMS.filter((i) => ['facilities', 'briefings', 'reports'].includes(i.icon)),
    },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* ── Desktop Sidebar ── */}
      {desktop && (
        <Box
          component="nav"
          aria-label="Primary"
          sx={{
            width: collapsed ? sidebar.collapsed : sidebar.expanded,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 250ms cubic-bezier(0.2, 0, 0, 1)',
            overflowX: 'hidden',
            zIndex: theme.zIndex.drawer,
          }}
        >
          {/* Logo & Branding */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{
              height: 64,
              px: collapsed ? 2 : 2.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 2px 6px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <HealthAndSafetyIcon sx={{ fontSize: 22 }} />
            </Box>
            {!collapsed && (
              <Stack spacing={-0.25}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: -0.3 }}>
                  SwasthyaOps
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Enterprise AI
                </Typography>
              </Stack>
            )}
          </Stack>

          {/* Nav Items */}
          <Box sx={{ flex: 1, py: 2, px: 1.5, overflowY: 'auto', overflowX: 'hidden' }}>
            {navGroups.map((group, groupIdx) => (
              <Box key={group.title} sx={{ mb: 3 }}>
                {!collapsed && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      px: 1.5,
                      mb: 1,
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 0.8,
                      textTransform: 'uppercase',
                    }}
                  >
                    {group.title}
                  </Typography>
                )}
                {collapsed && groupIdx > 0 && <Box sx={{ my: 1, borderTop: '1px solid', borderColor: 'divider', mx: 1 }} />}
                <Stack spacing={0.5}>
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = ICONS[item.icon];
                    const count = getBadgeCount(item.icon);

                    const content = (
                      <Stack
                        component={Link}
                        href={item.href}
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        sx={{
                          textDecoration: 'none',
                          py: 1,
                          px: collapsed ? 1.25 : 1.5,
                          borderRadius: 2,
                          bgcolor: active ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                          color: active ? 'primary.main' : 'text.secondary',
                          fontWeight: active ? 600 : 500,
                          transition: 'all 150ms',
                          position: 'relative',
                          '&:hover': {
                            bgcolor: active ? alpha(theme.palette.primary.main, 0.16) : 'action.hover',
                            color: active ? 'primary.main' : 'text.primary',
                          },
                        }}
                      >
                        <Badge
                          badgeContent={collapsed ? count : 0}
                          color={item.icon === 'alerts' ? 'error' : 'primary'}
                          variant={collapsed ? 'dot' : 'standard'}
                        >
                          <Icon sx={{ fontSize: 22, flexShrink: 0 }} />
                        </Badge>
                        {!collapsed && (
                          <Typography variant="body2" sx={{ fontWeight: 'inherit', flex: 1, whiteSpace: 'nowrap' }}>
                            {item.label}
                          </Typography>
                        )}
                        {!collapsed && count > 0 && (
                          <Chip
                            size="small"
                            label={count}
                            color={item.icon === 'alerts' ? 'error' : 'primary'}
                            sx={{ height: 20, minWidth: 20, fontSize: 11, fontWeight: 700 }}
                          />
                        )}
                      </Stack>
                    );

                    return collapsed ? (
                      <Tooltip key={item.href} title={`${item.label}${count > 0 ? ` (${count})` : ''}`} placement="right">
                        {content}
                      </Tooltip>
                    ) : (
                      <Box key={item.href}>{content}</Box>
                    );
                  })}
                </Stack>
              </Box>
            ))}
          </Box>

          {/* Sidebar Footer / User Profile & Collapse */}
          <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              {!collapsed && (
                <ButtonBase
                  onClick={(e) => setProfileAnchor(e.currentTarget)}
                  sx={{
                    borderRadius: 2,
                    px: 0.5,
                    py: 0.25,
                    minWidth: 0,
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
                    <Avatar
                      src={user?.photoURL ?? undefined}
                      alt={displayName}
                      sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13, fontWeight: 600 }}
                    >
                      {initials}
                    </Avatar>
                    <Stack sx={{ minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, fontSize: 13 }}>
                        {displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11, maxWidth: 140 }}>
                        {email}
                      </Typography>
                    </Stack>
                  </Stack>
                </ButtonBase>
              )}
              <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
                <IconButton
                  onClick={() => setCollapsed(!collapsed)}
                  size="small"
                  sx={{
                    mx: collapsed ? 'auto' : 0,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                  }}
                >
                  {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </Box>
      )}

      {/* ── Main Area ── */}
      <Box sx={{ flex: 1, minWidth: 0, pb: desktop ? 0 : 9, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            zIndex: theme.zIndex.appBar - 1,
          }}
        >
          <Toolbar sx={{ height: 64, gap: 2, px: { xs: 2, md: 3 } }}>
            {/* Breadcrumb Trail */}
            <Box sx={{ display: { xs: 'none', sm: 'block' }, mr: 1 }}>
              <Breadcrumbs />
            </Box>

            <Box sx={{ flex: 1 }} />

            {/* Global Search Bar */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 1.5,
                py: 0.5,
                width: { xs: 180, sm: 260, md: 320 },
                transition: 'all 150ms',
                '&:focus-within': {
                  borderColor: 'primary.main',
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.15)}`,
                },
              }}
            >
              <SearchIcon sx={{ fontSize: 18, color: 'text.secondary', mr: 1 }} />
              <InputBase
                placeholder="Search facilities, alerts, or reports..."
                sx={{ fontSize: 13, flex: 1 }}
                inputProps={{ 'aria-label': 'search' }}
              />
              <Box
                component="span"
                sx={{
                  display: { xs: 'none', md: 'inline-block' },
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'text.secondary',
                  bgcolor: 'action.hover',
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                ⌘K
              </Box>
            </Box>

            {/* District Chip */}
            <Chip
              size="small"
              variant="outlined"
              label={`District ${district.name}, ${district.state}`}
              sx={{ fontWeight: 600, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}
            />

            {/* Theme Toggle Switch */}
            <Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
              <IconButton onClick={toggleColorMode} size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                {mode === 'light' ? <DarkModeOutlinedIcon fontSize="small" /> : <LightModeOutlinedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            {/* Notification Bell */}
            <Tooltip title="Alert Inbox">
              <IconButton component={Link} href="/alerts" size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                <Badge badgeContent={openAlertsCount} color="error">
                  <NotificationsNoneOutlinedIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Mobile Avatar */}
            {!desktop && (
              <ButtonBase onClick={(e) => setProfileAnchor(e.currentTarget)} sx={{ borderRadius: '50%' }}>
                <Avatar
                  src={user?.photoURL ?? undefined}
                  alt={displayName}
                  sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}
                >
                  {initials}
                </Avatar>
              </ButtonBase>
            )}
          </Toolbar>
        </AppBar>

        {/* Profile menu (desktop footer + mobile avatar) */}
        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={() => setProfileAnchor(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          slotProps={{ paper: { sx: { minWidth: 220 } } }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleSignOut} sx={{ fontSize: 13, py: 1 }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sign out
          </MenuItem>
        </Menu>

        {/* Page Content */}
        <Box sx={{ flex: 1, bgcolor: 'background.default' }}>{children}</Box>
      </Box>

      {/* ── Mobile Bottom Bar ── */}
      {!desktop && (
        <Stack
          component="nav"
          aria-label="Primary Mobile"
          direction="row"
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            px: 0.5,
            pt: 0.75,
            pb: 'max(6px, env(safe-area-inset-bottom))',
            justifyContent: 'space-around',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = ICONS[item.icon];
            const count = getBadgeCount(item.icon);

            return (
              <Stack
                key={item.href}
                component={Link}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                alignItems="center"
                spacing={0.25}
                sx={{
                  textDecoration: 'none',
                  py: 0.5,
                  px: 1,
                  flex: 1,
                  borderRadius: 2,
                  color: active ? 'primary.main' : 'text.secondary',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Badge badgeContent={count} color={item.icon === 'alerts' ? 'error' : 'primary'} variant="dot">
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 44,
                      height: 28,
                      borderRadius: 4,
                      bgcolor: active ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                      transition: 'background-color 150ms',
                    }}
                  >
                    <Icon sx={{ fontSize: 20 }} />
                  </Box>
                </Badge>
                <Typography sx={{ fontSize: 10, fontWeight: active ? 700 : 500, mt: 0.25 }}>
                  {item.short}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
