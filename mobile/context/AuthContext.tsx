import { createContext, useContext, useEffect, useRef, useCallback, useState, type ReactNode } from 'react';
import { useAuth as useClerkAuth, useClerk } from '@clerk/clerk-expo';
import { api } from '../lib/api';
import type { User } from '../lib/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { signOut } = useClerk();

  const [appUser, setAppUser] = useState<User | null>(null);
  const [isFetchingUser, setIsFetchingUser] = useState(false);

  // Generation counter — only the most-recently-started fetchAppUser() call may
  // write to state. Prevents a stale GET from overwriting a fresher refreshUser().
  const fetchGenRef = useRef(0);

  const fetchAppUser = useCallback(async (): Promise<void> => {
    const generation = ++fetchGenRef.current;
    setIsFetchingUser(true);
    try {
      const user = await api.get<User>('/users/me');
      if (generation === fetchGenRef.current) {
        setAppUser(user);
      }
    } catch {
      if (generation === fetchGenRef.current) {
        setAppUser(null);
      }
    } finally {
      if (generation === fetchGenRef.current) {
        setIsFetchingUser(false);
      }
    }
  }, []);

  // Whenever Clerk sign-in state changes, sync the app user
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      fetchAppUser();
    } else {
      fetchGenRef.current++; // cancel any in-flight fetch
      setAppUser(null);
      setIsFetchingUser(false);
    }
  }, [isSignedIn, isLoaded, fetchAppUser]);

  const logout = useCallback(async () => {
    fetchGenRef.current++;   // cancel any in-flight fetch
    setAppUser(null);
    setIsFetchingUser(false); // clear loading indicator immediately
    await signOut();
  }, [signOut]);

  const refreshUser = useCallback(async () => {
    await fetchAppUser();
  }, [fetchAppUser]);

  // isLoading = Clerk hasn't resolved yet, OR user is signed in but we
  // haven't fetched the app user yet (blocks ProtectedRoute from flickering)
  const isLoading = !isLoaded || (!!isSignedIn && isFetchingUser && !appUser);

  return (
    <AuthContext.Provider value={{ user: appUser, isLoading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
