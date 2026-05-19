import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { ClerkProvider, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { LanguageProvider } from '../context/LanguageContext';
import { connectWS, disconnectWS } from '../lib/websocket';
import { setClerkTokenGetter } from '../lib/api';
import { setWsTokenGetter } from '../lib/websocket';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment');
}

// Clerk token cache backed by expo-secure-store
const tokenCache = {
  async getToken(key: string) {
    try { return await SecureStore.getItemAsync(key); }
    catch { return null; }
  },
  async saveToken(key: string, value: string) {
    try { await SecureStore.setItemAsync(key, value); }
    catch {}
  },
  async clearToken(key: string) {
    try { await SecureStore.deleteItemAsync(key); }
    catch {}
  },
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

/** Wires the Clerk token getter into api.ts and websocket.ts right after ClerkProvider mounts. */
function ClerkTokenBridge() {
  const { getToken } = useClerkAuth();

  useEffect(() => {
    const getter = () => getToken();
    setClerkTokenGetter(getter);
    setWsTokenGetter(getter);
    // Nothing to clean up — getter identity is stable
  }, [getToken]);

  return null;
}

function RootGuard() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) router.replace('/(auth)/login');
    if (user && inAuth) router.replace('/(tabs)');
  }, [user, isLoading, segments, router]);

  return null;
}

function AppShell() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const qc = useQueryClient();

  // Connect WebSocket when user logs in; disconnect on logout
  useEffect(() => {
    if (!user) {
      disconnectWS();
      return;
    }

    // connectWS now uses beforeConnect to fetch a fresh Clerk token automatically
    connectWS(user.id, (notification) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });

      if (notification.type === 'GRADE_PUBLISHED') {
        qc.invalidateQueries({ queryKey: ['student-pending-exercises'] });
        qc.invalidateQueries({ queryKey: ['my-submissions'] });
        qc.invalidateQueries({ queryKey: ['my-results'] });
        qc.invalidateQueries({ queryKey: ['exercises'] });
        qc.invalidateQueries({ queryKey: ['submissions'] });
      } else if (notification.type === 'NEW_EXERCISE') {
        qc.invalidateQueries({ queryKey: ['student-pending-exercises'] });
        qc.invalidateQueries({ queryKey: ['exercises'] });
        qc.invalidateQueries({ queryKey: ['student-courses'] });
        qc.invalidateQueries({ queryKey: ['teacher-courses'] });
      } else if (notification.type === 'SUBMISSION_RECEIVED') {
        qc.invalidateQueries({ queryKey: ['pending-submissions'] });
      }
    });

    return () => {
      disconnectWS();
    };
  }, [user?.id, qc]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, headerBackTitle: '', headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course/[id]" options={{ headerShown: true, title: 'Curso' }} />
        <Stack.Screen name="exercise/[id]" options={{ headerShown: true, title: 'Ejercicio' }} />
        <Stack.Screen name="submissions/[exerciseId]" options={{ headerShown: true, title: 'Respuestas' }} />
        <Stack.Screen name="grade/[submissionId]" options={{ headerShown: true, title: 'Calificar' }} />
        <Stack.Screen name="pending-exercises" options={{ headerShown: true, title: 'Pendientes' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!} tokenCache={tokenCache}>
      <ClerkTokenBridge />
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <RootGuard />
              <AppShell />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
