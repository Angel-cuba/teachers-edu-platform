import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react-native';
import { api } from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { useFadeInUp } from '../../lib/useFadeInUp';
import type { Submission } from '../../lib/types';
import { extractApiError } from '../../utils/extractApiError';

export default function GradeScreen() {
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const fadeAnim = useFadeInUp(0, 350);

  const { data: submission, isLoading } = useQuery<Submission>({
    queryKey: ['submission', submissionId],
    queryFn: () => api.get<Submission>(`/submissions/${submissionId}`),
  });

  // Populate form once on first load — guard with !score so edits aren't overwritten on background refetch
  useEffect(() => {
    if (submission?.grade && !score) {
      setScore(String(submission.grade.score));
      setFeedback(submission.grade.feedback ?? '');
    }
  }, [submission?.grade]); // eslint-disable-line react-hooks/exhaustive-deps

  const grade = useMutation({
    mutationFn: () => api.post(`/submissions/${submissionId}/grade`, { score: Number(score), feedback }),
    onSuccess: () => {
      Alert.alert('Calificación guardada', 'El alumno ha sido notificado.');
      qc.invalidateQueries({ queryKey: ['submission', submissionId] });
      qc.invalidateQueries({ queryKey: ['submissions'] });
      qc.invalidateQueries({ queryKey: ['pending-submissions'] });
      router.back();
    },
    onError: (e: unknown) => Alert.alert('Error', extractApiError(e)),
  });

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}><ActivityIndicator color="#4F46E5" /></View>;
  if (!submission) return null;

  return (
    <Animated.ScrollView
      style={{ flex: 1, backgroundColor: colors.bg, ...fadeAnim }}
      contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 4 }}>ALUMNO</Text>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{submission.studentName}</Text>
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 8 }}>RESPUESTA</Text>
          <View style={{ backgroundColor: colors.inputBg, borderRadius: 12, padding: 14 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>{submission.answer}</Text>
          </View>
        </View>
      </View>

      <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Star color="#D97706" size={20} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Calificación</Text>
        </View>

        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Puntuación (0–1000)</Text>
          <TextInput
            value={score}
            onChangeText={setScore}
            keyboardType="numeric"
            placeholder="Ej: 85"
            placeholderTextColor={colors.textMuted}
            style={{ borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 18, color: colors.text, fontWeight: '700', width: 140, backgroundColor: colors.inputBg }}
          />
        </View>

        <View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>Comentarios (opcional)</Text>
          <TextInput
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={4}
            placeholder="Añade comentarios para el alumno..."
            placeholderTextColor={colors.textMuted}
            style={{ borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12, padding: 16, fontSize: 15, color: colors.text, textAlignVertical: 'top', minHeight: 100, backgroundColor: colors.inputBg }}
          />
        </View>

        <TouchableOpacity
          onPress={() => grade.mutate()}
          disabled={grade.isPending || !score}
          style={{ backgroundColor: grade.isPending || !score ? '#A5B4FC' : '#4F46E5', borderRadius: 12, paddingVertical: 15, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {grade.isPending ? 'Guardando...' : 'Guardar calificación'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.ScrollView>
  );
}
