/**
 * S2 — AI Command Center (docs/08_App_Flow.md §3).
 * Desktop: KPI row → [facility panel | alert stream] → approvals.
 * Data: demo storyline (src/lib/demo-data.ts) until Firestore listeners land (Sprint 7).
 */
import Box from '@mui/material/Box';
import KpiTile from '@/components/KpiTile';
import AlertStream from '@/components/AlertStream';
import ApprovalQueue from '@/components/ApprovalQueue';
import FacilityRiskList from '@/components/FacilityRiskList';
import { kpis } from '@/lib/demo-data';

export default function CommandCenterPage() {
  return (
    <Box component="main" sx={{ p: { xs: 2, md: 3 }, display: 'grid', gap: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(6, 1fr)' },
        }}
      >
        {kpis.map((kpi) => <KpiTile key={kpi.label} kpi={kpi} />)}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          alignItems: 'stretch',
        }}
      >
        <FacilityRiskList />
        <AlertStream />
      </Box>

      <ApprovalQueue />
    </Box>
  );
}
