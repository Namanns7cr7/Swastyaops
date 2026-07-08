/**
 * Command-center route group: every screen shares the AppShell (rail/bottom nav +
 * top bar) declared once here. Facility PWA screens get their own group (docs/08 §1).
 */
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';

export default function CommandLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
