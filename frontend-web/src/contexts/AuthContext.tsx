import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthResponse } from '../types';
import api from '../api/axios';
import { connect as wsConnect, disconnect as wsDisconnect } from '../api/websocket';

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
        try {
          const parsedUser = JSON.parse(storedUser) as User;
          // Validate token by fetching user profile
          const { data } = await api.get<User>('/users/me');
          setAccessToken(storedToken);
          setUser(data || parsedUser);

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
        }
      }

      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    await setupSession(data);
  };

  const register = async (data: RegisterData) => {
    const { data: authData } = await api.post<AuthResponse>('/auth/register', data);
    await setupSession(authData);
  };

  const logout = useCallback(() => {
    wsDisconnect();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setAccessToken(null);
  }, []);

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
