"use client";

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { UserRole } from '@/types/firestore';

export interface AuthState {
  user: User | null;
  role: UserRole | null;
  isSuperAdmin: boolean;
  consultantId: string | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    isSuperAdmin: false,
    consultantId: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: User | null) => {
        if (!user) {
          setAuthState({
            user: null,
            role: null,
            isSuperAdmin: false,
            consultantId: null,
            loading: false,
            error: null,
          });
          return;
        }

        try {
          // Force refresh token to get latest claims if needed
          const tokenResult = await user.getIdTokenResult();
          
          setAuthState({
            user,
            role: (tokenResult.claims.role as UserRole) || null,
            isSuperAdmin: !!tokenResult.claims.isSuperAdmin,
            consultantId: (tokenResult.claims.consultantId as string) || null,
            loading: false,
            error: null,
          });

          // Auto-refresh token every 55 minutes
          const fiftyFiveMinutes = 55 * 60 * 1000;
          const refresher = setInterval(async () => {
            await user.getIdToken(true);
          }, fiftyFiveMinutes);

          return () => clearInterval(refresher);

        } catch (error: any) {
          setAuthState((prev) => ({
            ...prev,
            loading: false,
            error: error.message,
          }));
        }
      },
      (error: Error) => {
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
      }
    );

    return () => unsubscribe();
  }, []);

  return authState;
}
