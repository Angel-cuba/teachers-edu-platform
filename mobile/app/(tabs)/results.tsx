import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock, TrendingUp } from 'lucide-react-native';
import { api } from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import type { Submission } from '../../lib/types';

export default function ResultsScreen() {
  const { colors } = useTheme();

  const { data: submissions = [], isLoading, refetch, isRefetching } = useQuery<Submission[]>({
    queryKey: ['my-submissions'],
    queryFn: () => api.get<Submission[]>('/submissions/my').catch(() => []),
  });

  const graded = submissions.filter(s => s.status === 'GRADED');
  const avg = graded.length > 0 ? Math.round(graded.reduce((a, s) => a + (s.grade?.score ?? 0), 0) / graded.length) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {submissions.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 0 }}>
          <StatCard label="Entregas" value={submissions.length} color="#4F46E5" bg="#EEF2FF" secColor={colors.textSecondary} />
          <StatCard label="Calificadas" value={graded.length} color="#059669" bg="#ECFDF5" secColor={colors.textSecondary} />
          <StatCard label="Promedio" value={avg !== null ? `${avg}p` : '—'} color="#D97706" bg="#FFFBEB" secColor={colors.textSecondary} />
        </View>
      )}

      <FlatList
        data={submissions}
        keyExtractor={s => s.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4F46E5" />}
        ListEmptyComponent={
          isLoading ? <ActivityIndicator style={{ marginTop: 40 }} color="#4F46E5" /> : (
            <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
              <TrendingUp color={colors.textMuted} size={48} />
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>Aún no has entregado ejercicios</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 8 }}>
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{item.exerciseTitle || 'Ejercicio'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {item.status === 'GRADED' ? (
                <><CheckCircle color="#059669" size={15} /><Text style={{ color: '#059669', fontSize: 13, fontWeight: '600' }}>Calificada</Text></>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFBEB', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Clock color="#D97706" size={13} />
                  <Text style={{ color: '#D97706', fontSize: 12, fontWeight: '600' }}>En corrección</Text>
                </View>
              )}
              {item.grade && (
                <Text style={{ marginLeft: 'auto', fontWeight: '700', color: '#4F46E5', fontSize: 15 }}>
                  {item.grade.score} pts
                </Text>
              )}
            </View>
            {item.grade?.feedback && (
              <Text style={{ color: colors.textSecondary, fontSize: 13, fontStyle: 'italic' }}>"{item.grade.feedback}"</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

function StatCard({ label, value, color, bg, secColor }: {
  label: string;
  value: number | string;
  color: string;
  bg: string;
  secColor: string;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: bg, borderRadius: 14, padding: 14, alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ color: secColor, fontSize: 12, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
