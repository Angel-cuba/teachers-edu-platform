import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (m: ThemeMode) => void;
  // Convenience color tokens
  colors: {
    bg: string;
    card: string;
    border: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    inputBg: string;
    inputBorder: string;
    tabBar: string;
  };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const light = {
  bg: '#F9FAFB',
  card: '#FFFFFF',
  border: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  inputBg: '#FFFFFF',
  inputBorder: '#E5E7EB',
  tabBar: '#FFFFFF',
};

const dark = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  inputBg: '#1E293B',
  inputBorder: '#334155',
  tabBar: '#1E293B',
};

/** Shape of the `colors` object exposed by `useTheme()`. */
export type ThemeColors = typeof light;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem('themeMode').then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
    });
  }, []);

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const setMode = (m: ThemeMode) => {
    AsyncStorage.setItem('themeMode', m);
    setModeState(m);
  };

  const colors = isDark ? dark : light;

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
