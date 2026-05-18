import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getStoredUser } from '../lib/auth';
import { api } from '../lib/api';
import type { User } from '../lib/types';

// ─── Session expiry constants ────────────────────────────────────────────────
// The app forces re-login if it has been closed / backgrounded for longer than
// this period. Updated while the app is active; checked every time the app
// comes to the foreground. No polling — driven entirely by AppState events.
const SESSION_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours
const LAST_SEEN_KEY = 'session_last_seen';
const HEARTBEAT_INTERVAL_MS = 30 * 60 * 1000; // refresh timestamp every 30 min
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount — includes session-expiry gate
  useEffect(() => {
    const init = async () => {
      // ── Session expiry check ────────────────────────────────────────────────
      // If the app was killed / sent to background for more than SESSION_TTL_MS,
      // discard the stored session and send the user to the login screen.
      // Checked before restoring state so the transition is immediate.
      const lastSeen = await SecureStore.getItemAsync(LAST_SEEN_KEY);
      // null lastSeen = first launch after install or SecureStore externally cleared.
      // Intentionally allowed: no session to expire yet; the guard only applies
      // once a valid session has been established and the key written.
      if (lastSeen && Date.now() - parseInt(lastSeen, 10) > SESSION_TTL_MS) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('user');
        await SecureStore.deleteItemAsync(LAST_SEEN_KEY);
        setUser(null);
        setIsLoading(false);
        return;
      }
      // ────────────────────────────────────────────────────────────────────────

      const u = await getStoredUser();
      if (u) {
        // Refresh the timestamp now that the session is confirmed active
        await SecureStore.setItemAsync(LAST_SEEN_KEY, Date.now().toString());
      }
      setUser(u);
      setIsLoading(false);
    };

    init();
  }, []);

  // `router` is expo-router's module-level singleton (not a hook return value),
  // so its identity is stable across renders and safe to omit from deps.
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ensure local session is cleared even if the API call fails
    }
    await SecureStore.deleteItemAsync(LAST_SEEN_KEY);
    setUser(null);
    router.replace('/login');
  }, []);

  // ── Session guard: AppState + periodic heartbeat ───────────────────────────
  // Fires only when the user is authenticated. Uses the React Native AppState
  // API (zero cost while inactive) plus a low-frequency interval to keep the
  // timestamp fresh during long uninterrupted foreground sessions.
  useEffect(() => {
    if (!user) return;

    const updateHeartbeat = () =>
      SecureStore.setItemAsync(LAST_SEEN_KEY, Date.now().toString());

    const onAppStateChange = async (state: AppStateStatus) => {
      if (state !== 'active') return;

      const lastSeen = await SecureStore.getItemAsync(LAST_SEEN_KEY);
      if (lastSeen && Date.now() - parseInt(lastSeen, 10) > SESSION_TTL_MS) {
        // App was in background / killed for > 48 h → force re-login
        await logout();
        return;
      }
      // App is back to foreground — refresh the timestamp
      await updateHeartbeat();
    };

    const sub = AppState.addEventListener('change', onAppStateChange);
    // Keep timestamp fresh for long uninterrupted foreground sessions
    const interval = setInterval(updateHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [user, logout]);
  // ──────────────────────────────────────────────────────────────────────────

  async function login(email: string, password: string) {
    const data = await apiLogin(email, password);
    // Reset the last-seen clock so the 48-h window starts fresh on login
    await SecureStore.setItemAsync(LAST_SEEN_KEY, Date.now().toString());
    setUser(data.user);
    router.replace('/(tabs)');
  }

  async function register(displayName: string, email: string, password: string, role: string) {
    const data = await apiRegister(displayName, email, password, role);
    await SecureStore.setItemAsync(LAST_SEEN_KEY, Date.now().toString());
    setUser(data.user);
    router.replace('/(tabs)');
  }

  async function refreshUser() {
    try {
      const updated = await api.get<User>('/users/me');
      const userToStore: User = {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        role: updated.role,
        avatarUrl: updated.avatarUrl,
      };
      await SecureStore.setItemAsync('user', JSON.stringify(userToStore));
      setUser(userToStore);
    } catch {
      // ignore — user stays as-is
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
