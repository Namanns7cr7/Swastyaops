'use client';

/**
 * ApprovalQueue — AI-drafted operational decision queue.
 * Replaces hackathon gradients with clean Google Cloud Console / Looker Studio cards.
 * Features AI agent avatars, confidence scores, inline editing, and rejection feedback loops.
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import CheckIcon from '@mui/icons-material/Check';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import { useTheme, alpha } from '@mui/material/styles';
import { approvals } from '@/lib/demo-data';
import EmptyState from './EmptyState';

export default function ApprovalQueue() {
  const theme = useTheme();
  const [items, setItems] = useState(approvals);
  const [toast, setToast] = useState<string | null>(null);

  // Dialog State
  const [editItem, setEditItem] = useState<{ id: string; qty: string } | null>(null);
  const [rejectItem, setRejectItem] = useState<{ id: string; reason: string } | null>(null);

  const handleApprove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setToast(`Approved request ${id} successfully! PDF order sent to facilities.`);
  };

  const handleEditSave = () => {
    if (!editItem) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === editItem.id) {
          const updatedActions = [...item.actions];
          if (updatedActions[0]) {
            updatedActions[0] = updatedActions[0].replace(/^\d+×/, `${editItem.qty}×`);
          }
          return {
            ...item,
            title: item.title.replace(/^\w+\s+\d+×/, `Transfer ${editItem.qty}×`),
            actions: updatedActions,
          };
        }
        return item;
      })
    );
    setEditItem(null);
    setToast(`Updated request parameters successfully.`);
  };

  const handleRejectSubmit = () => {
    if (!rejectItem) return;
    setItems((prev) => prev.filter((item) => item.id !== rejectItem.id));
    setToast(`Rejected request ${rejectItem.id}. Reason forwarded to AI agent feedback loop.`);
    setRejectItem(null);
  };

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Pending AI Decisions
            </Typography>
            <Chip size="small" color="primary" label={`${items.length} waiting`} sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
          </Stack>
        }
        subheader="AI drafts recommendations based on stock burn and outbreak risk · Human-in-the-loop sign-off required"
        sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}
      />

      <Box sx={{ p: 2 }}>
        {items.length === 0 ? (
          <EmptyState
            title="No decisions pending"
            description="All AI recommendations have been evaluated and dispatched. The district supply chain is balanced."
            actionLabel="View Archived Orders"
            actionHref="/approvals"
          />
        ) : (
          <Stack spacing={2}>
            {items.map((rec) => (
              <Collapse key={rec.id} in={true} timeout={250}>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2.5,
                    p: 2,
                    bgcolor: 'background.default',
                    transition: 'all 200ms cubic-bezier(0.2, 0, 0, 1)',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: theme.shadows[2],
                    },
                  }}
                >
                  {/* Card Header Row: Agent Avatar + Title + Age */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1} sx={{ mb: 1.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                          color: 'primary.main',
                          border: '1px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.24),
                        }}
                      >
                        <PsychologyOutlinedIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Stack spacing={0.25}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 15 }}>
                          {rec.title}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, fontSize: 11 }}>
                            ✦ {rec.agent}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            ·
                          </Typography>
                          <Chip
                            size="small"
                            label="96% Confidence"
                            sx={{
                              height: 18,
                              fontSize: 10,
                              fontWeight: 700,
                              bgcolor: alpha(theme.palette.success.main, 0.1),
                              color: 'success.main',
                            }}
                          />
                        </Stack>
                      </Stack>
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1 }}>
                      Pending {rec.ageHours}h
                    </Typography>
                  </Stack>

                  {/* Rationale Body */}
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 2, pl: { sm: 6 } }}>
                    {rec.rationale}
                  </Typography>

                  {/* Action Chips */}
                  <Stack direction="row" spacing={1} sx={{ mb: 2, pl: { sm: 6 }, flexWrap: 'wrap', rowGap: 0.75 }}>
                    {rec.actions.map((a) => (
                      <Chip
                        key={a}
                        size="small"
                        variant="outlined"
                        label={a}
                        icon={<AutoAwesomeIcon sx={{ fontSize: 12, color: 'primary.main !important' }} />}
                        sx={{ bgcolor: 'background.paper', fontWeight: 500, fontSize: 12 }}
                      />
                    ))}
                  </Stack>

                  {/* Button Control Row */}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    justifyContent="space-between"
                    spacing={1.5}
                    sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider', pl: { sm: 6 } }}
                  >
                    <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckIcon />}
                        onClick={() => handleApprove(rec.id)}
                        sx={{ px: 2.5, fontWeight: 600 }}
                      >
                        Approve & Dispatch
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditOutlinedIcon />}
                        onClick={() => setEditItem({ id: rec.id, qty: rec.actions[0]?.match(/^(\d+)×/)?.[1] || '40' })}
                      >
                        Edit Params
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="text"
                        startIcon={<CloseIcon />}
                        onClick={() => setRejectItem({ id: rec.id, reason: '' })}
                      >
                        Reject
                      </Button>
                    </Stack>

                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11, textAlign: { xs: 'left', sm: 'right' } }}>
                      Requires CMO sign-off per EDL protocol
                    </Typography>
                  </Stack>
                </Box>
              </Collapse>
            ))}
          </Stack>
        )}
      </Box>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast(null)} message={toast} />

      {/* Edit Quantity Dialog */}
      <Dialog open={!!editItem} onClose={() => setEditItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Recommendation Parameters</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Adjust the quantity to be transferred or indented. Re-validated against current safety covers.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Quantity to Transfer / Order"
            type="number"
            fullWidth
            value={editItem?.qty || ''}
            onChange={(e) => setEditItem((prev) => (prev ? { ...prev, qty: e.target.value } : null))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setEditItem(null)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Reason Dialog */}
      <Dialog open={!!rejectItem} onClose={() => setRejectItem(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Provide Rejection Rationale</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your feedback is routed directly to the Recommendation Agent evaluation feed to refine decision boundaries.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Rejection"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={rejectItem?.reason || ''}
            onChange={(e) => setRejectItem((prev) => (prev ? { ...prev, reason: e.target.value } : null))}
            placeholder="e.g. Road conditions blocked, or local inventory actually sufficient..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setRejectItem(null)}>Cancel</Button>
          <Button onClick={handleRejectSubmit} variant="contained" color="error">
            Reject Recommendation
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
