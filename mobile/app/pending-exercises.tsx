import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Clock, BookOpen, AlertCircle } from 'lucide-react-native';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFadeInUp } from '../lib/useFadeInUp';
import { ExerciseCard } from '../components/ExerciseCard';
import type { Exercise } from '../lib/types';

export default function PendingExercisesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  // Teacher guard — this screen is student-only
  useEffect(() => {
    if (user && user.role !== 'STUDENT') {
      router.replace('/(tabs)');
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps — intentional: only re-run when user changes

  // Entrance animation
  const screenAnim = useFadeInUp(0);

  const { data: exercises = [], isLoading, isError, isRefetching, refetch } = useQuery<Exercise[]>({
    queryKey: ['student-pending-exercises'],
    queryFn: () => api.get<Exercise[]>('/exercises/pending'),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color="#4F46E5" size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg, gap: 14, padding: 32 }}>
        <AlertCircle color="#EF4444" size={40} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
          No se pudieron cargar los ejercicios
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={{ backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, backgroundColor: colors.bg, ...screenAnim }}>
      <FlatList
        data={exercises}
        keyExtractor={e => e.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4F46E5" />}
        ListHeaderComponent={
          exercises.length > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFBEB', justifyContent: 'center', alignItems: 'center' }}>
                <Clock color="#D97706" size={18} />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                  Ejercicios pendientes
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 1 }}>
                  {exercises.length} {exercises.length === 1 ? 'actividad por entregar' : 'actividades por entregar'}
                </Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', paddingTop: 80, gap: 14 }}>
            <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' }}>
              <BookOpen color="#059669" size={32} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>¡Todo al día!</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
              No tienes ejercicios pendientes por entregar.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <ExerciseCard
            exercise={item}
            index={index}
            colors={colors}
            onPress={() => router.push(`/exercise/${item.id}` as `/${string}`)}
          />
        )}
      />
    </Animated.View>
  );
}

