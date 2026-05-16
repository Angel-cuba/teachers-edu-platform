import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getStoredUser } from '../lib/auth';
import { api } from '../lib/api';
import type { User } from '../lib/types';

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

  useEffect(() => {
    getStoredUser().then(u => {
      setUser(u);
      setIsLoading(false);
    });
  }, []);

  async function login(email: string, password: string) {
    const data = await apiLogin(email, password);
    setUser(data.user);
    router.replace('/(tabs)');
  }

  async function register(displayName: string, email: string, password: string, role: string) {
    const data = await apiRegister(displayName, email, password, role);
    setUser(data.user);
    router.replace('/(tabs)');
  }

  async function logout() {
    await apiLogout();
    setUser(null);
    router.replace('/login');
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
    } catch (e) {
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
