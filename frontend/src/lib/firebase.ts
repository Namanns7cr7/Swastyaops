/**
 * Firebase init: Auth + Firestore with offline persistence.
 * Clients read Firestore directly (rules-scoped, docs/04 §1.8) but NEVER write it —
 * all mutations go through the /v1 API via the outbox (docs/08 §7.2, ADR-0002).
 *
 * NOTE: Wrapped in try/catch so that an invalid/mock API key (used in demo deployments)
 * never crashes the app. Auth falls back to the dev mock bypass in lib/auth.tsx.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  type Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_GCP_PROJECT ?? '',
};

// Singleton Firebase app — safe to call multiple times (hot reload, strict mode).
let _app: FirebaseApp;
let _auth: Auth;
let _db: Firestore;

try {
  _app = getApps()[0] ?? initializeApp(config);
  _auth = getAuth(_app);

  // Offline-first persistence — IndexedDB only in browser, memory on SSR.
  _db =
    typeof window === 'undefined'
      ? initializeFirestore(_app, {})
      : initializeFirestore(_app, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        });
} catch (e) {
  // Running with a placeholder/mock API key (CI, demo). Auth falls back to mock bypass.
  console.warn('[firebase] Initialization skipped (mock config):', (e as Error).message);
  _app = getApps()[0];
  _auth = _app ? getAuth(_app) : ({} as Auth);
  _db = {} as Firestore;
}

export const app = _app!;
export const auth = _auth!;
export const db = _db!;

if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
  import('firebase/auth').then(({ connectAuthEmulator }) => {
    try { connectAuthEmulator(_auth, 'http://localhost:9099', { disableWarnings: true }); } catch {}
  });
}

/** Custom-claim scope, read once per session; server re-enforces regardless (docs/13 §4). */
export async function getScope() {
  try {
    const token = await auth.currentUser?.getIdTokenResult();
    return {
      role: (token?.claims.role as string) ?? null,
      districtIds: (token?.claims.district_ids as string[]) ?? [],
      facilityIds: (token?.claims.facility_ids as string[]) ?? [],
    };
  } catch {
    return { role: null, districtIds: [], facilityIds: [] };
  }
}
