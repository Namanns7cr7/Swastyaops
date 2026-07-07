/**
 * Shared navigation config — single source for the desktop rail and mobile bottom bar
 * (docs/08 §1). Icons resolve in AppShell to keep this module server-safe.
 */
export interface NavItem {
  label: string;
  short: string; // rail / bottom-bar caption
  href: string;
  icon: 'dashboard' | 'alerts' | 'approvals' | 'facilities' | 'briefings' | 'reports';
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Command Center', short: 'Home', href: '/', icon: 'dashboard' },
  { label: 'Alerts', short: 'Alerts', href: '/alerts', icon: 'alerts' },
  { label: 'Approvals', short: 'Approve', href: '/approvals', icon: 'approvals' },
  { label: 'Facilities', short: 'Facilities', href: '/facilities', icon: 'facilities' },
  { label: 'Briefings', short: 'Briefings', href: '/briefings', icon: 'briefings' },
  { label: 'Reports', short: 'Reports', href: '/reports', icon: 'reports' },
];
