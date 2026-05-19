import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';
import { User } from '../types';
import api, { setClerkTokenGetter } from '../api/axios';
import { connect as wsConnect, disconnect as wsDisconnect, setWsTokenGetter } from '../api/websocket';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  /** Re-fetches /api/users/me and updates the cached user (call after profile mutations). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { signOut } = useClerk();

  const [appUser, setAppUser] = useState<User | null>(null);
  const [isFetchingUser, setIsFetchingUser] = useState(false);

  // Generation counter: when two fetches are in flight concurrently (e.g. auto-fetch
  // from isSignedIn effect + explicit refreshUser call), only the last-started fetch
  // updates state. This prevents a stale GET from overwriting a fresher one.
  const fetchGenRef = useRef(0);

  // Wire Clerk's getToken into the axios interceptor and the WebSocket token getter.
  useEffect(() => {
    setClerkTokenGetter(getToken);
    setWsTokenGetter(getToken);
  }, [getToken]);

  const fetchAppUser = useCallback(async (): Promise<User | null> => {
    const generation = ++fetchGenRef.current;
    setIsFetchingUser(true);
    try {
      const { data } = await api.get<User>('/users/me');
      // Ignore results from superseded fetches (generation mismatch)
      if (generation === fetchGenRef.current) {
        setAppUser(data);
      }
      return data;
    } catch {
      if (generation === fetchGenRef.current) {
        setAppUser(null);
      }
      return null;
    } finally {
      if (generation === fetchGenRef.current) {
        setIsFetchingUser(false);
      }
    }
  }, []);

  // Sync Clerk auth state → app user + WebSocket
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      fetchAppUser().then(async (user) => {
        if (!user) return;
        try {
          // wsConnect() uses beforeConnect to fetch a fresh token before each attempt
          await wsConnect();
        } catch {
          console.warn('WebSocket connection failed — real-time notifications unavailable');
        }
      });
    } else {
      setAppUser(null);
      wsDisconnect();
    }
  }, [isLoaded, isSignedIn, fetchAppUser]);

  const logout = useCallback(async () => {
    wsDisconnect();
    setAppUser(null);
    await signOut();
  }, [signOut]);

  const refreshUser = useCallback(async () => {
    await fetchAppUser();
  }, [fetchAppUser]);

  // isLoading is true in two cases:
  // 1. Clerk has not finished initialising (!isLoaded)
  // 2. Clerk says we're signed in but we haven't fetched the app-level user yet —
  //    without this guard, ProtectedRoute would redirect to /login before the
  //    role-bearing User object arrives from the backend.
  const isLoading = !isLoaded || (!!isSignedIn && isFetchingUser && !appUser);

  return (
    <AuthContext.Provider
      value={{
        user: appUser,
        isLoading,
        isAuthenticated: !!isSignedIn && !!appUser,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
