'use client';

/**
 * Approvals Queue Page — Human-in-the-loop decision sign-off.
 * Reuses the redesigned ApprovalQueue component with Google Cloud Console header hierarchy.
 */
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ApprovalQueue from '@/components/ApprovalQueue';
import PageHeader from '@/components/PageHeader';
import { approvals } from '@/lib/demo-data';

export default function ApprovalsPage() {
  return (
    <Box component="main" sx={{ p: { xs: 2, md: 3 }, maxWidth: 1080, mx: 'auto' }}>
      <PageHeader
        title="Pending AI Decisions & Sign-Offs"
        subtitle="AI Recommendation Agents continuously evaluate stock burn, outbreak vectors, and logistical constraints. Review, edit parameters, or approve drafts to dispatch legally compliant supply chain transfer orders."
        badge={<Chip size="small" icon={<AutoAwesomeIcon sx={{ fontSize: 12 }} />} label={`${approvals.length} Waiting Sign-Off`} color="primary" sx={{ fontWeight: 700 }} />}
      />
      <ApprovalQueue />
    </Box>
  );
}
