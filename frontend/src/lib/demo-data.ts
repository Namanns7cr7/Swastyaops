/**
 * "Monsoon Week in Sikar" demo dataset (docs/15_Presentation.md §2).
 * Shape mirrors the Firestore documents (docs/04) so swapping to live listeners in
 * Sprint 7 replaces this module without touching components.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Kpi {
  label: string;
  value: string;
  delta?: string;
  tone: 'critical' | 'high' | 'ok' | 'neutral';
  spark?: number[]; // last 14 days
}

export type AlertStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved';

export interface Alert {
  id: string;
  type: string;
  severity: Severity;
  status: AlertStatus;
  title: string;
  facility: string;
  minutesAgo: number;
  source: string;
}

export interface Approval {
  id: string;
  title: string;
  rationale: string;
  actions: string[];
  agent: string;
  ageHours: number;
}

export interface FacilityRisk {
  id: string;
  name: string;
  type: 'PHC' | 'CHC' | 'DH';
  block: string;
  score: number; // 0-100 health score
  issue: string;
}

export const district = { name: 'Sikar', state: 'Rajasthan', facilities: 111, reporting: 96 };

export const kpis: Kpi[] = [
  { label: 'Open criticals', value: '2', delta: '+1 overnight', tone: 'critical', spark: [0, 0, 1, 1, 0, 0, 1, 1, 1, 2, 1, 1, 2, 2] },
  { label: 'Stock-risk facilities', value: '7', delta: '+3 this week', tone: 'high', spark: [2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6, 7, 7] },
  { label: 'Doctors present', value: '84%', delta: '188 of 224 marked', tone: 'ok', spark: [81, 84, 86, 83, 85, 82, 79, 84, 85, 86, 84, 83, 85, 84] },
  { label: 'Beds available', value: '118', delta: 'of 462 sanctioned', tone: 'neutral', spark: [160, 152, 149, 150, 143, 138, 141, 133, 130, 126, 121, 124, 120, 118] },
  { label: 'Labs down', value: '5', delta: '2 reagent-out', tone: 'high', spark: [3, 3, 4, 3, 3, 4, 4, 4, 5, 5, 4, 5, 5, 5] },
  { label: 'Facilities reporting', value: '96/111', delta: 'today, by 11:00', tone: 'ok', spark: [88, 90, 91, 92, 90, 94, 93, 95, 92, 96, 95, 97, 96, 96] },
];

export const alerts: Alert[] = [
  { id: 'alr_7c1', type: 'stockout_predicted', severity: 'high', status: 'open', title: 'ORS projected stock-out in 6 days', facility: 'PHC Losal', minutesAgo: 38, source: 'Forecast · BigQuery ML' },
  { id: 'alr_9d4', type: 'outbreak_suspected', severity: 'critical', status: 'acknowledged', title: 'Diarrheal cluster — footfall 2.8σ above baseline across 3 catchments', facility: 'Ringas block', minutesAgo: 112, source: 'Disease Intelligence Agent' },
  { id: 'alr_2b8', type: 'bed_saturation', severity: 'high', status: 'open', title: 'Bed occupancy 87% sustained 26h', facility: 'CHC Fatehpur', minutesAgo: 174, source: 'Bed Agent' },
  { id: 'alr_5e2', type: 'lab_downtime', severity: 'medium', status: 'in_progress', title: 'Haemoglobin test down 52h — Drabkin’s reagent out', facility: 'CHC Khandela', minutesAgo: 310, source: 'Laboratory Agent' },
  { id: 'alr_1f9', type: 'reporting_gap', severity: 'medium', status: 'open', title: 'No reports for 3 days — marked stale', facility: 'PHC Dujod', minutesAgo: 468, source: 'Doctor Agent' },
  { id: 'alr_8a3', type: 'stockout_predicted', severity: 'low', status: 'open', title: 'Zinc sulphate below 14-day cover', facility: 'PHC Piprali', minutesAgo: 550, source: 'Forecast · BigQuery ML' },
  { id: 'alr_3c7', type: 'stockout_predicted', severity: 'medium', status: 'resolved', title: 'Paracetamol syrup restocked — 90-day cover', facility: 'PHC Ranoli', minutesAgo: 1440, source: 'Forecast · BigQuery ML' },
  { id: 'alr_6b2', type: 'attendance_anomaly', severity: 'low', status: 'resolved', title: 'Attendance reconciled — leave calendar matched', facility: 'PHC Palsana', minutesAgo: 2100, source: 'Doctor Agent' },
];

export const approvals: Approval[] = [
  {
    id: 'rec_9f2',
    title: 'Transfer 40× ORS — CHC Fatehpur → PHC Losal',
    rationale: 'Losal exhausts ORS ~12 Jul at current burn (19/day, rising with diarrheal footfall). Fatehpur holds 64 surplus after 21-day cover + buffer; 22 min by road.',
    actions: ['40× EDL-ORS-200 by 10 Jul', 'Order PDF to both facilities on approval'],
    agent: 'Inventory → Recommendation Agent',
    ageHours: 3,
  },
  {
    id: 'rec_a41',
    title: 'Emergency indent — zinc sulphate, 3 facilities',
    rationale: 'No in-district donor covers ≥70% of the projected gap for Losal, Piprali, Khandela before the next RMSC cycle (28 Jul).',
    actions: ['1,200× EDL-ZNC-020 · priority: urgent', 'RMSC e-Aushadhi indent draft attached'],
    agent: 'Inventory → Recommendation Agent',
    ageHours: 26,
  },
];

export const facilityRisks: FacilityRisk[] = [
  { id: 'phc-losal', name: 'PHC Losal', type: 'PHC', block: 'Sikar', score: 41, issue: 'ORS T-6d · footfall +38%' },
  { id: 'chc-ringas', name: 'CHC Ringas', type: 'CHC', block: 'Srimadhopur', score: 48, issue: 'Outbreak watch · zinc low' },
  { id: 'chc-fatehpur', name: 'CHC Fatehpur', type: 'CHC', block: 'Fatehpur', score: 55, issue: 'Beds 87% · donor for rec_9f2' },
  { id: 'phc-khandela', name: 'PHC Khandela Rural', type: 'PHC', block: 'Khandela', score: 58, issue: 'Hb test down 52h' },
  { id: 'phc-dujod', name: 'PHC Dujod', type: 'PHC', block: 'Sikar', score: 62, issue: 'Stale — no reports 3d' },
  { id: 'phc-piprali', name: 'PHC Piprali', type: 'PHC', block: 'Piprali', score: 71, issue: 'Zinc below 14-day cover' },
];

// ── Facility directory (S7 list; extends the risk set with healthy facilities) ──
export interface FacilityRow extends FacilityRisk {
  doctorsPresent: string;
  bedsFree: number | null; // null = no IPD
  reportedToday: boolean;
}

export const facilities: FacilityRow[] = [
  ...facilityRisks.map((f) => ({
    ...f,
    doctorsPresent: f.id === 'phc-dujod' ? '—' : f.type === 'CHC' ? '4/6' : '1/2',
    bedsFree: f.type === 'CHC' ? (f.id === 'chc-fatehpur' ? 4 : 11) : 3,
    reportedToday: f.id !== 'phc-dujod',
  })),
  { id: 'dh-sikar', name: 'District Hospital Sikar', type: 'DH', block: 'Sikar', score: 82, issue: '—', doctorsPresent: '36/42', bedsFree: 47, reportedToday: true },
  { id: 'chc-neem-ka-thana', name: 'CHC Neem Ka Thana', type: 'CHC', block: 'Neem Ka Thana', score: 88, issue: '—', doctorsPresent: '5/6', bedsFree: 14, reportedToday: true },
  { id: 'chc-losal', name: 'CHC Laxmangarh', type: 'CHC', block: 'Laxmangarh', score: 84, issue: '—', doctorsPresent: '4/5', bedsFree: 12, reportedToday: true },
  { id: 'phc-ranoli', name: 'PHC Ranoli', type: 'PHC', block: 'Sikar', score: 91, issue: '—', doctorsPresent: '1/1', bedsFree: 5, reportedToday: true },
  { id: 'phc-palsana', name: 'PHC Palsana', type: 'PHC', block: 'Dantaramgarh', score: 87, issue: '—', doctorsPresent: '2/2', bedsFree: 4, reportedToday: true },
];

// ── Daily briefing (S12; structure mirrors the Executive Briefing Agent output) ──
export const briefing = {
  date: 'Today · generated 06:42 IST',
  wordCount: 274,
  sections: [
    {
      heading: 'Decisions needed',
      items: [
        { text: '1. Transfer 40× ORS from CHC Fatehpur to PHC Losal — stock-out projected 12 Jul; donor retains 21-day cover. Pending 3 h.', link: '/approvals' },
        { text: '2. Emergency zinc indent for 3 facilities — no in-district donor covers the gap before the 28 Jul RMSC cycle. Pending 26 h.', link: '/approvals' },
      ],
    },
    {
      heading: 'New overnight',
      items: [
        { text: 'Diarrheal signal in Ringas block strengthened: footfall 2.8σ above baseline across 3 catchments, coherent spatially, monsoon onset corroborates. Confidence 0.72.', link: '/alerts' },
      ],
    },
    {
      heading: 'Watching',
      items: [
        { text: 'CHC Fatehpur beds at 87% for 26 h — nearest alternatives CHC Laxmangarh (12 free, 31 min), DH Sikar (47 free, 48 min).', link: '/alerts' },
        { text: 'Haemoglobin testing down 52 h at CHC Khandela; reagent indent drafted, nearest alternative PHC Piprali.', link: '/alerts' },
      ],
    },
    {
      heading: 'Resolved',
      items: [
        { text: 'Paracetamol syrup at PHC Ranoli restocked to 90-day cover; alert closed automatically.', link: '/alerts' },
      ],
    },
    {
      heading: 'District pulse',
      items: [
        { text: '96 of 111 facilities reporting by 11:00; district health score 74 (−2 vs yesterday, driven by the Ringas signal).', link: '/' },
      ],
    },
  ],
};

// ── Reports library (S13) ──
export interface ReportRow {
  id: string;
  title: string;
  period: string;
  kind: 'monthly' | 'outbreak' | 'adhoc';
  status: 'available' | 'generating';
}

export const reports: ReportRow[] = [
  { id: 'rpt_jun26', title: 'District performance report — state review format', period: 'June 2026', kind: 'monthly', status: 'available' },
  { id: 'rpt_may26', title: 'District performance report — state review format', period: 'May 2026', kind: 'monthly', status: 'available' },
  { id: 'rpt_dng25', title: 'Outbreak post-mortem — dengue cluster, Fatehpur block', period: 'Sep–Oct 2025', kind: 'outbreak', status: 'available' },
  { id: 'rpt_jul26', title: 'District performance report — state review format', period: 'July 2026', kind: 'monthly', status: 'generating' },
];
