'use client';

/**
 * Breadcrumb navigation component — maps current pathname to Google Cloud Console style trail.
 * Promotes spatial orientation across district operational views.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { useTheme } from '@mui/material/styles';

const ROUTE_LABELS: Record<string, string> = {
  '': 'Command Center',
  'alerts': 'Alert Inbox',
  'approvals': 'Pending Approvals',
  'facilities': 'Facility Directory',
  'briefings': 'Daily Briefing',
  'reports': 'Reports Library',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const theme = useTheme();

  // Split path into segments, ignoring empty strings
  const segments = pathname.split('/').filter(Boolean);

  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
      aria-label="breadcrumb"
      sx={{
        '& .MuiBreadcrumbs-ol': {
          alignItems: 'center',
        },
      }}
    >
      <Stack
        component={Link}
        href="/"
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{
          color: segments.length === 0 ? 'text.primary' : 'text.secondary',
          textDecoration: 'none',
          fontSize: 13,
          fontWeight: segments.length === 0 ? 600 : 400,
          transition: 'color 150ms',
          '&:hover': {
            color: 'primary.main',
          },
        }}
      >
        <HomeOutlinedIcon sx={{ fontSize: 16 }} />
        <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
          {ROUTE_LABELS['']}
        </Typography>
      </Stack>

      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return isLast ? (
          <Typography
            key={href}
            color="text.primary"
            sx={{ fontSize: 13, fontWeight: 600 }}
          >
            {label}
          </Typography>
        ) : (
          <Typography
            key={href}
            component={Link}
            href={href}
            color="text.secondary"
            sx={{
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 400,
              transition: 'color 150ms',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            {label}
          </Typography>
        );
      })}
    </MuiBreadcrumbs>
  );
}
