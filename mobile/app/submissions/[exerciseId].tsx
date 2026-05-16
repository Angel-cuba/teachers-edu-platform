import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Clock } from 'lucide-react-native';
import { api } from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import type { Submission } from '../../lib/types';

export default function SubmissionsScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { colors } = useTheme();
  const router = useRouter();

  const { data: submissions = [], isLoading, refetch, isRefetching } = useQuery<Submission[]>({
    queryKey: ['submissions', exerciseId],
    queryFn: () => api.get<Submission[]>(`/exercises/${exerciseId}/submissions`),
  });

  const pending = submissions.filter(s => s.status === 'PENDING').length;
  const graded = submissions.filter(s => s.status === 'GRADED').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', gap: 10, padding: 16 }}>
        <View style={{ flex: 1, backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#D97706' }}>{pending}</Text>
          <Text style={{ color: '#92400E', fontSize: 12 }}>Pendientes</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#ECFDF5', borderRadius: 12, padding: 14, alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#059669' }}>{graded}</Text>
          <Text style={{ color: '#065F46', fontSize: 12 }}>Calificadas</Text>
        </View>
      </View>

      <FlatList
        data={submissions}
        keyExtractor={s => s.id}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4F46E5" />}
        ListEmptyComponent={
          isLoading ? <ActivityIndicator style={{ marginTop: 40 }} color="#4F46E5" /> : (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>Ningún alumno ha respondido todavía</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/grade/${item.id}` as any)}
            style={{ backgroundColor: colors.card, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{item.studentName}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }} numberOfLines={2}>{item.answer}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              {item.status === 'GRADED' ? (
                <><CheckCircle color="#059669" size={18} /><Text style={{ color: '#059669', fontSize: 12, fontWeight: '600' }}>{item.grade?.score} pts</Text></>
              ) : (
                <><Clock color="#D97706" size={18} /><Text style={{ color: '#D97706', fontSize: 12, fontWeight: '600' }}>Calificar →</Text></>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
