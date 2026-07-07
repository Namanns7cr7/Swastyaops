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

export interface Alert {
  id: string;
  type: string;
  severity: Severity;
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
  { id: 'alr_7c1', type: 'stockout_predicted', severity: 'high', title: 'ORS projected stock-out in 6 days', facility: 'PHC Losal', minutesAgo: 38, source: 'Forecast · BigQuery ML' },
  { id: 'alr_9d4', type: 'outbreak_suspected', severity: 'critical', title: 'Diarrheal cluster — footfall 2.8σ above baseline across 3 catchments', facility: 'Ringas block', minutesAgo: 112, source: 'Disease Intelligence Agent' },
  { id: 'alr_2b8', type: 'bed_saturation', severity: 'high', title: 'Bed occupancy 87% sustained 26h', facility: 'CHC Fatehpur', minutesAgo: 174, source: 'Bed Agent' },
  { id: 'alr_5e2', type: 'lab_downtime', severity: 'medium', title: 'Haemoglobin test down 52h — Drabkin’s reagent out', facility: 'CHC Khandela', minutesAgo: 310, source: 'Laboratory Agent' },
  { id: 'alr_1f9', type: 'reporting_gap', severity: 'medium', title: 'No reports for 3 days — marked stale', facility: 'PHC Dujod', minutesAgo: 468, source: 'Doctor Agent' },
  { id: 'alr_8a3', type: 'stockout_predicted', severity: 'low', title: 'Zinc sulphate below 14-day cover', facility: 'PHC Piprali', minutesAgo: 550, source: 'Forecast · BigQuery ML' },
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
