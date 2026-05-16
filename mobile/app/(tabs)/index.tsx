import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, Bell, Clock, ClipboardCheck } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../lib/api';
import { useFadeInUp } from '../../lib/useFadeInUp';
import { ExerciseCard } from '../../components/ExerciseCard';
import type { Course, Notification, Exercise, Submission } from '../../lib/types';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const headerAnim = useFadeInUp(0);
  const cardsAnim = useFadeInUp(80);
  const listAnim = useFadeInUp(160);

  const { data: courses = [], isLoading: loadingCourses, isRefetching: refetchingCourses } = useQuery<Course[]>({
    queryKey: isTeacher ? ['teacher-courses'] : ['student-courses'],
    queryFn: () => api.get<Course[]>(isTeacher ? '/courses/my' : '/courses/enrolled'),
    refetchInterval: 60_000,
  });

  const { data: notifications = [], isRefetching: refetchingNotifs } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications'),
    refetchInterval: 30_000,
  });

  // Student: pending exercises count
  const { data: pendingExercises = [], isRefetching: refetchingExercises } = useQuery<Exercise[]>({
    queryKey: ['student-pending-exercises'],
    queryFn: () => api.get<Exercise[]>('/exercises/pending').catch(() => []),
    enabled: !isTeacher,
    refetchInterval: 30_000,
  });

  // Teacher: pending submissions count
  const { data: pendingSubmissions = [], isRefetching: refetchingSubmissions } = useQuery<Submission[]>({
    queryKey: ['pending-submissions'],
    queryFn: () => api.get<Submission[]>('/submissions/pending').catch(() => []),
    enabled: isTeacher,
    refetchInterval: 30_000,
  });

  const unreadNotifs = notifications.filter(n => !n.isRead).length;
  const isRefreshing = refetchingNotifs || refetchingCourses || refetchingExercises || refetchingSubmissions;

  function onRefresh() {
    qc.invalidateQueries({ queryKey: isTeacher ? ['teacher-courses'] : ['student-courses'] });
    qc.invalidateQueries({ queryKey: ['notifications'] });
    qc.invalidateQueries({ queryKey: isTeacher ? ['pending-submissions'] : ['student-pending-exercises'] });
  }

  if (loadingCourses) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color="#4F46E5" size="large" />
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, gap: 20 }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
    >
      {/* Greeting */}
      <Animated.View style={headerAnim}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
          ¡Hola, {user?.displayName?.split(' ')[0]}! 👋
        </Text>
        <Text style={{ color: colors.textSecondary, marginTop: 2, fontSize: 14 }}>
          {isTeacher ? 'Panel del profesor' : 'Panel del alumno'}
        </Text>
      </Animated.View>

      {/* Stat cards */}
      <Animated.View style={[{ flexDirection: 'row', gap: 12 }, cardsAnim]}>
        <StatCard
          icon={<BookOpen color="#4F46E5" size={20} />}
          label="Cursos"
          value={courses.length}
          bg="#EEF2FF"
          textColor="#4F46E5"
          secColor={colors.textSecondary}
        />
        {unreadNotifs > 0 && (
          <StatCard
            icon={<Bell color="#D97706" size={20} />}
            label="Sin leer"
            value={unreadNotifs}
            bg="#FFFBEB"
            textColor="#D97706"
            secColor={colors.textSecondary}
            onPress={() => router.push('/(tabs)/notifications')}
          />
        )}
        {isTeacher && pendingSubmissions.length > 0 && (
          <StatCard
            icon={<ClipboardCheck color="#7C3AED" size={20} />}
            label="Por calificar"
            value={pendingSubmissions.length}
            bg="#F5F3FF"
            textColor="#7C3AED"
            secColor={colors.textSecondary}
          />
        )}
        {!isTeacher && pendingExercises.length > 0 && (
          <StatCard
            icon={<Clock color="#D97706" size={20} />}
            label="Pendientes"
            value={pendingExercises.length}
            bg="#FFFBEB"
            textColor="#D97706"
            secColor={colors.textSecondary}
            onPress={() => router.push('/pending-exercises')}
          />
        )}
      </Animated.View>

      {/* Course list */}
      <Animated.View style={listAnim}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            {isTeacher ? 'Mis cursos' : 'Cursos inscritos'}
          </Text>
          {courses.length > 3 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/courses')}>
              <Text style={{ fontSize: 13, color: '#4F46E5', fontWeight: '600' }}>Ver todos →</Text>
            </TouchableOpacity>
          )}
        </View>

        {courses.length === 0 ? (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 32, alignItems: 'center' }}>
            <BookOpen color={colors.textMuted} size={40} />
            <Text style={{ color: colors.textMuted, marginTop: 10, textAlign: 'center' }}>
              {isTeacher ? 'Crea tu primer curso' : 'Únete a un curso con el código del profesor'}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/courses')}
              style={{ marginTop: 16, backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                {isTeacher ? 'Crear curso' : 'Unirse a curso'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          courses.slice(0, 3).map(course => (
            <TouchableOpacity
              key={course.id}
              onPress={() => router.push(`/course/${course.id}` as `/${string}`)}
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' }}>
                <BookOpen color="#4F46E5" size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{course.title}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                  {isTeacher ? `${course.studentCount} alumnos` : course.teacherName}
                </Text>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </Animated.View>

      {/* Student: inline pending exercises list */}
      {!isTeacher && pendingExercises.length > 0 && (
        <Animated.View style={[{ marginTop: 4, paddingBottom: 24 }, listAnim]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Ejercicios pendientes</Text>
            {pendingExercises.length > 3 && (
              <TouchableOpacity onPress={() => router.push('/pending-exercises')}>
                <Text style={{ fontSize: 13, color: '#4F46E5', fontWeight: '600' }}>Ver todos →</Text>
              </TouchableOpacity>
            )}
          </View>
          {pendingExercises.slice(0, 3).map((ex, i) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              index={i}
              colors={colors}
              onPress={() => router.push(`/exercise/${ex.id}` as `/${string}`)}
            />
          ))}
        </Animated.View>
      )}
    </ScrollView>
  );
}

function StatCard({
  icon, label, value, bg, textColor, secColor, onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bg: string;
  textColor: string;
  secColor: string;
  onPress?: () => void;
}) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? label : undefined}
      style={{ flex: 1, backgroundColor: bg, borderRadius: 16, padding: 16, gap: 8 }}
    >
      {icon}
      <Text style={{ fontSize: 26, fontWeight: '800', color: textColor }}>{value}</Text>
      <Text style={{ color: secColor, fontSize: 13 }}>{label}</Text>
    </Wrapper>
  );
}
