/**
 * S5 — Approval queue (docs/08 §2). Reuses the queue component; the full S6
 * recommendation detail (editable actions, validity snapshot) lands in Sprint 7.
 */
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ApprovalQueue from '@/components/ApprovalQueue';
import { approvals } from '@/lib/demo-data';

export default function ApprovalsPage() {
  return (
    <Box component="main" sx={{ p: { xs: 2, md: 3 }, display: 'grid', gap: 2, maxWidth: 880 }}>
      <Stack direction="row" alignItems="baseline" spacing={1.5} flexWrap="wrap">
        <Typography variant="h3">Approvals</Typography>
        <Typography variant="body2" color="text.secondary">
          {approvals.length} pending · AI drafts, you sign — every action re-validated at approval
        </Typography>
      </Stack>
      <ApprovalQueue />
    </Box>
  );
}
