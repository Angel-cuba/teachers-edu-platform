import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthResponse } from '../types';
import api from '../api/axios';
import { connect as wsConnect, disconnect as wsDisconnect } from '../api/websocket';

// ─── Session expiry constants ────────────────────────────────────────────────
// The app forces re-login if it has been closed / backgrounded for longer than
// this period. Updated while the app is open; checked every time the tab
// regains visibility. No polling — entirely event-driven.
const SESSION_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const LAST_SEEN_KEY = 'session_last_seen';
const HEARTBEAT_INTERVAL_MS = 30 * 60 * 1000; // refresh timestamp every 30 min
// ─────────────────────────────────────────────────────────────────────────────

interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  role: 'TEACHER' | 'STUDENT';
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setupSession = useCallback(async (authResponse: AuthResponse) => {
    localStorage.setItem('accessToken', authResponse.accessToken);
    localStorage.setItem('refreshToken', authResponse.refreshToken);
    localStorage.setItem('user', JSON.stringify(authResponse.user));
    // Reset the last-seen clock so the 48-h window starts fresh on login
    localStorage.setItem(LAST_SEEN_KEY, Date.now().toString());
    setAccessToken(authResponse.accessToken);
    setUser(authResponse.user);

    try {
      await wsConnect(authResponse.accessToken);
    } catch {
      console.warn('WebSocket connection failed, real-time notifications unavailable');
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        // ── Session expiry check ──────────────────────────────────────────────
        // If the browser was closed (or the tab was in the background) for more
        // than SESSION_TTL_MS, the stored session is considered stale and the
        // user must log in again. Checked here — before hitting the API — so
        // the redirect happens immediately, without waiting for a network round-trip.
        const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
        // null lastSeen = first open after install or storage cleared externally.
        // Intentionally allowed: no session to expire yet; the guard only applies
        // once a valid session has been established and the key written.
        if (lastSeen && Date.now() - parseInt(lastSeen, 10) > SESSION_TTL_MS) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem(LAST_SEEN_KEY);
          setIsLoading(false);
          return;
        }
        // ─────────────────────────────────────────────────────────────────────

        try {
          const parsedUser = JSON.parse(storedUser) as User;
          // Validate token by fetching user profile
          const { data } = await api.get<User>('/users/me');
          setAccessToken(storedToken);
          setUser(data || parsedUser);
          // Refresh the timestamp now that the session is confirmed active
          localStorage.setItem(LAST_SEEN_KEY, Date.now().toString());

          try {
            await wsConnect(storedToken);
          } catch {
            console.warn('WebSocket connection failed');
          }
        } catch {
          // Token invalid — clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem(LAST_SEEN_KEY);
        }
      }

      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const logout = useCallback(() => {
    wsDisconnect();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem(LAST_SEEN_KEY);
    setUser(null);
    setAccessToken(null);
  }, []);

  // ── Session guard: visibilitychange + periodic heartbeat ───────────────────
  // Fires only when the user is authenticated. Uses the Page Visibility API
  // (zero cost while hidden) plus a low-frequency interval to keep the
  // timestamp fresh during long uninterrupted sessions.
  useEffect(() => {
    if (!user) return;

    const updateHeartbeat = () =>
      localStorage.setItem(LAST_SEEN_KEY, Date.now().toString());

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;

      const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
      if (lastSeen && Date.now() - parseInt(lastSeen, 10) > SESSION_TTL_MS) {
        // Tab was hidden / browser was closed for > 48 h → force re-login
        logout();
        return;
      }
      // Tab is back — refresh the timestamp
      updateHeartbeat();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    // Keep timestamp fresh for long uninterrupted sessions (single focused tab)
    const interval = setInterval(updateHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(interval);
    };
  }, [user, logout]);
  // ──────────────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    await setupSession(data);
  };

  const register = async (data: RegisterData) => {
    const { data: authData } = await api.post<AuthResponse>('/auth/register', data);
    await setupSession(authData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
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
