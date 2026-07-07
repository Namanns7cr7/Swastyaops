/**
 * Firebase init: Auth + Firestore with offline persistence.
 * Clients read Firestore directly (rules-scoped, docs/04 §1.8) but NEVER write it —
 * all mutations go through the /v1 API via the outbox (docs/08 §7.2, ADR-0002).
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_GCP_PROJECT!, // swasthyaops-{env}
};

export const app = getApps()[0] ?? initializeApp(config);
export const auth = getAuth(app);

// Offline-first: full local mirror of the user's scoped data (NFR-4, 72h window).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}

/** Custom-claim scope, read once per session; server re-enforces regardless (docs/13 §4). */
export async function getScope() {
  const token = await auth.currentUser?.getIdTokenResult();
  return {
    role: (token?.claims.role as string) ?? null,
    districtIds: (token?.claims.district_ids as string[]) ?? [],
    facilityIds: (token?.claims.facility_ids as string[]) ?? [],
  };
}
