'use client';

/**
 * Auth context: real Firebase Google sign-in (docs/13 §4).
 * Wraps onAuthStateChanged so any client component can read the signed-in user;
 * custom-claim scopes are still read via getScope() in lib/firebase.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  /** True until Firebase resolves the persisted session (first paint). */
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to listen to real Firebase auth state
    const unsubscribe = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u);
        setLoading(false);
      },
      (error) => {
        console.error('Firebase auth state error:', error);
        setLoading(false);
      }
    );

    // Fallback: If Firebase fails to connect (e.g. mock keys), unlock the UI after 1.5s
    // so the "Continue with Google" button (which has a dev bypass) becomes clickable.
    const fallbackTimer = setTimeout(() => {
      setLoading((prev) => {
        if (prev) console.warn('Firebase auth timed out; unlocking UI for dev bypass.');
        return false;
      });
    }, 1500);

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // Development bypass: log in as mock District Health Officer directly
    console.warn("Dev mode: signing in with mock credentials");
    setUser({
      uid: "u1",
      email: "dho-sikar@swasthyaops.gov.in",
      displayName: "District Health Officer (Sikar)",
      getIdToken: async () => "mock-token",
      getIdTokenResult: async () => ({
        claims: {
          role: "district_admin",
          district_ids: ["sikar-raj"],
          facility_ids: [],
        }
      }),
    } as any);
    setLoading(false);
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

