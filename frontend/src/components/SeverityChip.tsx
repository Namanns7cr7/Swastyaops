'use client';

/**
 * Severity is never color-alone (WCAG 1.4.1, docs/09 §2): icon + label + color.
 */
import Chip from '@mui/material/Chip';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useTheme } from '@mui/material/styles';
import { status } from '@/theme/tokens';
import type { Severity } from '@/lib/demo-data';

const meta = {
  critical: { label: 'Critical', Icon: ErrorOutlineIcon, tone: 'critical' as const },
  high: { label: 'High', Icon: WarningAmberIcon, tone: 'high' as const },
  medium: { label: 'Medium', Icon: InfoOutlinedIcon, tone: 'stale' as const },
  low: { label: 'Low', Icon: RemoveCircleOutlineIcon, tone: 'stale' as const },
};

export default function SeverityChip({ severity }: { severity: Severity }) {
  const mode = useTheme().palette.mode;
  const { label, Icon, tone } = meta[severity];
  const colors = status[tone][mode];
  return (
    <Chip
      size="small"
      icon={<Icon sx={{ fontSize: 16, color: `${colors.fg} !important` }} />}
      label={label}
      sx={{ bgcolor: colors.bg, color: colors.fg, fontWeight: 600 }}
    />
  );
}
