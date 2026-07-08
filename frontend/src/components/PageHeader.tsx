'use client';

/**
 * PageHeader — Consistent Google Cloud Console style header for all district views.
 * Establishes clear visual hierarchy with title, AI context, and primary actions.
 */
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

interface PageHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  action?: React.ReactNode;
  badge?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action, badge }: PageHeaderProps) {
  return (
    <Box
      sx={{
        pb: 2.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        mb: 3,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
      >
        <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                letterSpacing: -0.5,
                fontSize: { xs: 24, md: 28 },
              }}
            >
              {title}
            </Typography>
            {badge}
          </Stack>
          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                lineHeight: 1.5,
                maxWidth: 720,
                fontWeight: 400,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Stack>

        {action && (
          <Box sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
            {action}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
