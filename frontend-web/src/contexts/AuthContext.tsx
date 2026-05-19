import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';
import { User } from '../types';
import api, { setClerkTokenGetter } from '../api/axios';
import { connect as wsConnect, disconnect as wsDisconnect } from '../api/websocket';

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

  // Wire Clerk's getToken into the axios interceptor so every request
  // automatically carries a fresh Bearer JWT without any manual storage.
  useEffect(() => {
    setClerkTokenGetter(getToken);
  }, [getToken]);

  const fetchAppUser = useCallback(async () => {
    setIsFetchingUser(true);
    try {
      const { data } = await api.get<User>('/users/me');
      setAppUser(data);
      return data;
    } catch {
      setAppUser(null);
      return null;
    } finally {
      setIsFetchingUser(false);
    }
  }, []);

  // Sync Clerk auth state → app user + WebSocket
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      fetchAppUser().then(async (user) => {
        if (!user) return;
        try {
          const token = await getToken();
          if (token) await wsConnect(token);
        } catch {
          console.warn('WebSocket connection failed — real-time notifications unavailable');
        }
      });
    } else {
      setAppUser(null);
      wsDisconnect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const logout = useCallback(async () => {
    wsDisconnect();
    setAppUser(null);
    await signOut();
  }, [signOut]);

  const refreshUser = useCallback(async () => {
    await fetchAppUser();
  }, [fetchAppUser]);

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
