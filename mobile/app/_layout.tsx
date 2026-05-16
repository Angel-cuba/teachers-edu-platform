import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { LanguageProvider } from '../context/LanguageContext';
import { connectWS, disconnectWS } from '../lib/websocket';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

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
    let cancelled = false;
    SecureStore.getItemAsync('accessToken').then(token => {
      if (cancelled || !token) return;
      connectWS(token, user.id, (notification) => {
        // Always refresh the notification badge
        qc.invalidateQueries({ queryKey: ['notifications'] });

        if (notification.type === 'GRADE_PUBLISHED') {
          // A submission was graded — update student views
          qc.invalidateQueries({ queryKey: ['student-pending-exercises'] });
          qc.invalidateQueries({ queryKey: ['my-submissions'] });
          qc.invalidateQueries({ queryKey: ['my-results'] });
          qc.invalidateQueries({ queryKey: ['exercises'] }); // mySubmissionStatus on course detail
          qc.invalidateQueries({ queryKey: ['submissions'] }); // covers ['submissions', id, 'mine'] on exercise detail
        } else if (notification.type === 'NEW_EXERCISE') {
          // A new exercise was published
          qc.invalidateQueries({ queryKey: ['student-pending-exercises'] });
          qc.invalidateQueries({ queryKey: ['exercises'] });
          qc.invalidateQueries({ queryKey: ['student-courses'] });
          qc.invalidateQueries({ queryKey: ['teacher-courses'] });
        } else if (notification.type === 'SUBMISSION_RECEIVED') {
          // A student submitted — update teacher pending queue
          // TODO: backend does not yet emit SUBMISSION_RECEIVED — add to NotificationService once ready
          qc.invalidateQueries({ queryKey: ['pending-submissions'] });
        }
      });
    });
    return () => {
      cancelled = true;
      disconnectWS();
    };
  }, [user?.id]);

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
  );
}
