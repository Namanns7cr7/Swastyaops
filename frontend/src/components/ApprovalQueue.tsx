'use client';

/**
 * S5 approval queue cards (docs/08 §3). Approve is pessimistic — server-confirmed
 * only (docs/09 §5); in demo mode the actions raise a snackbar instead.
 */
import { useState } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import CheckIcon from '@mui/icons-material/Check';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { approvals } from '@/lib/demo-data';

export default function ApprovalQueue() {
  const [toast, setToast] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader
        title={<Typography variant="subtitle1">Decisions waiting</Typography>}
        subheader="AI drafts · you sign"
        action={<Chip size="small" color="primary" label={approvals.length} />}
        sx={{ pb: 0 }}
      />
      <Stack spacing={1.5} sx={{ p: 2 }}>
        {approvals.map((rec) => (
          <Box key={rec.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, p: 1.75 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" gap={1}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{rec.title}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {rec.ageHours} h
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {rec.rationale}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
              {rec.actions.map((a) => <Chip key={a} size="small" variant="outlined" label={a} />)}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
              <Button size="small" variant="contained" startIcon={<CheckIcon />}
                onClick={() => setToast(`${rec.id}: approval requires the live API (Sprint 7)`)}>
                Approve
              </Button>
              <Button size="small" variant="outlined" startIcon={<EditOutlinedIcon />}
                onClick={() => setToast('Edit & approve opens S6 recommendation detail')}>
                Edit
              </Button>
              <Button size="small" color="error" startIcon={<CloseIcon />}
                onClick={() => setToast('Reject requires a reason — feeds the agent eval loop')}>
                Reject
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                ✦ {rec.agent}
              </Typography>
            </Stack>
          </Box>
        ))}
      </Stack>
      <Snackbar open={!!toast} autoHideDuration={3200} onClose={() => setToast(null)} message={toast} />
    </Card>
  );
}
