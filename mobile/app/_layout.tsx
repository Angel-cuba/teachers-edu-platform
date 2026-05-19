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
import { connectWS, disconnectWS, setWsTokenGetter } from '../lib/websocket';
import { setClerkTokenGetter } from '../lib/api';

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
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      // SecureStore has a 2048-byte limit per value. If exceeded (e.g. large
      // Clerk JWTs with custom claims), token won't survive app restarts but
      // Clerk's in-memory cache keeps the session alive for the current run.
      console.warn('[tokenCache] Failed to persist token — session will not survive restart:', e);
    }
  },
  async clearToken(key: string) {
    try { await SecureStore.deleteItemAsync(key); }
    catch {}
  },
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

/**
 * Wires Clerk's getToken into api.ts and websocket.ts.
 * Must render as the first child inside AuthProvider so its useEffect fires
 * before AuthProvider's own useEffect (React fires children's effects first).
 * Clerk does not guarantee getToken is referentially stable — the dep array
 * re-registers the getter whenever Clerk rotates its internal reference.
 */
function ClerkTokenBridge() {
  const { getToken } = useClerkAuth();

  useEffect(() => {
    const getter = () => getToken();
    setClerkTokenGetter(getter);
    setWsTokenGetter(getter);
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
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {/* ClerkTokenBridge must be first — its effect wires the token getter
                  before AuthProvider's own effect calls fetchAppUser() */}
              <ClerkTokenBridge />
              <RootGuard />
              <AppShell />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
