'use client';

/**
 * EmptyState — Reusable zero-data state with clean Material 3 enterprise styling.
 * Prevents blank screens and guides users toward helpful next actions.
 */
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { useTheme, alpha } from '@mui/material/styles';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: 6,
        px: 3,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: '1px dashed',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        {icon || <InboxOutlinedIcon sx={{ fontSize: 28 }} />}
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
        {title}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: actionLabel ? 3 : 0, lineHeight: 1.5 }}>
        {description}
      </Typography>

      {actionLabel && (
        <Button
          variant="outlined"
          size="small"
          onClick={onAction}
          href={actionHref}
          sx={{ borderRadius: 999, px: 3, fontWeight: 600 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
