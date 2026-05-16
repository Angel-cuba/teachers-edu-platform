import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Send, Users, Hourglass, Lock } from 'lucide-react-native';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { Exercise, Submission } from '../../lib/types';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [answer, setAnswer] = useState('');

  const { data: exercise, isLoading } = useQuery<Exercise>({
    queryKey: ['exercise', id],
    queryFn: () => api.get<Exercise>(`/exercises/${id}`),
  });

  const { data: mySubmissions = [] } = useQuery<Submission[]>({
    queryKey: ['submissions', id, 'mine'],
    queryFn: () => api.get<Submission[]>(`/exercises/${id}/submissions`),
    enabled: user?.role === 'STUDENT',
  });

  const mySubmission = mySubmissions[0];

  const submit = useMutation({
    mutationFn: () => api.post<Submission>(`/exercises/${id}/submit`, { answer }),
    onSuccess: () => {
      Alert.alert('¡Enviado!', 'Tu respuesta fue enviada correctamente.');
      qc.invalidateQueries({ queryKey: ['submissions', id] });
    },
    onError: (e: unknown) => Alert.alert('Error', (e as Error).message),
  });

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}><ActivityIndicator color="#4F46E5" /></View>;
  if (!exercise) return <View style={{ flex: 1, padding: 24, backgroundColor: colors.bg }}><Text style={{ color: '#EF4444' }}>Ejercicio no encontrado</Text></View>;

  const isOverdue = !!exercise.dueDate && new Date(exercise.dueDate) < new Date();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, gap: 16 }}>
      {/* Exercise info */}
      <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Badge label={exercise.type} color="#4F46E5" bg="#EEF2FF" />
          <Badge label={`${exercise.maxScore} pts`} color="#059669" bg="#ECFDF5" />
          {exercise.dueDate && (
            <Badge
              label={isOverdue ? `Vencido: ${new Date(exercise.dueDate).toLocaleDateString('es')}` : `Entrega: ${new Date(exercise.dueDate).toLocaleDateString('es')}`}
              color={isOverdue ? '#EF4444' : '#D97706'}
              bg={isOverdue ? '#FEF2F2' : '#FFFBEB'}
            />
          )}
        </View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>{exercise.title}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22 }}>{exercise.description}</Text>
      </View>

      {user?.role === 'STUDENT' && (
        <View style={{ gap: 12 }}>
          {mySubmission ? (
            <>
              {/* ── Awaiting grading banner ── */}
              {mySubmission.status === 'PENDING' && (
                <View style={{ backgroundColor: '#FFFBEB', borderRadius: 14, borderWidth: 1.5, borderColor: '#FDE68A', padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                    <Hourglass color="#D97706" size={18} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontWeight: '700', color: '#92400E', fontSize: 14 }}>
                      Respuesta enviada — en espera de corrección
                    </Text>
                    <Text style={{ color: '#B45309', fontSize: 12, lineHeight: 17 }}>
                      Tu profesor revisará tu respuesta y recibirás una notificación cuando esté calificada.
                    </Text>
                  </View>
                </View>
              )}

              {/* ── Graded result ── */}
              {mySubmission.status === 'GRADED' && mySubmission.grade && (
                <View style={{ backgroundColor: '#ECFDF5', borderRadius: 14, borderWidth: 1.5, borderColor: '#A7F3D0', padding: 16, gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CheckCircle color="#059669" size={18} />
                    <Text style={{ fontWeight: '700', color: '#065F46', fontSize: 14 }}>Calificada</Text>
                  </View>
                  <Text style={{ fontWeight: '800', color: '#059669', fontSize: 26 }}>
                    {mySubmission.grade.score}{' '}
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#6EE7B7' }}>/ {exercise.maxScore} pts</Text>
                  </Text>
                  {mySubmission.grade.feedback && (
                    <Text style={{ color: '#065F46', fontSize: 13, fontStyle: 'italic', borderTopWidth: 1, borderTopColor: '#A7F3D0', paddingTop: 8, marginTop: 4 }}>
                      "{mySubmission.grade.feedback}"
                    </Text>
                  )}
                </View>
              )}

              {/* ── Submitted answer ── */}
              <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Tu respuesta</Text>
                <View style={{ backgroundColor: colors.inputBg, borderRadius: 10, padding: 12 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>{mySubmission.answer}</Text>
                </View>
              </View>
            </>
          ) : isOverdue ? (
            /* ── Plazo vencido — sin entrega ── */
            <View style={{ backgroundColor: '#FEF2F2', borderRadius: 14, borderWidth: 1.5, borderColor: '#FECACA', padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                <Lock color="#EF4444" size={18} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontWeight: '700', color: '#991B1B', fontSize: 14 }}>
                  Plazo de entrega vencido
                </Text>
                <Text style={{ color: '#B91C1C', fontSize: 12, lineHeight: 17 }}>
                  La fecha límite ya pasó. Este ejercicio no puede ser entregado y quedará sin evaluación.
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20, gap: 12 }}>
              <Text style={{ fontWeight: '700', color: colors.text, fontSize: 16 }}>Tu respuesta</Text>
              <TextInput
                value={answer}
                onChangeText={setAnswer}
                multiline
                numberOfLines={5}
                placeholder="Escribe tu respuesta aquí..."
                placeholderTextColor={colors.textMuted}
                style={{ borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12, padding: 16, fontSize: 15, color: colors.text, textAlignVertical: 'top', minHeight: 120, backgroundColor: colors.inputBg }}
              />
              <TouchableOpacity
                onPress={() => submit.mutate()}
                disabled={submit.isPending || !answer.trim()}
                style={{ backgroundColor: submit.isPending || !answer.trim() ? '#A5B4FC' : '#4F46E5', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              >
                <Send color="#fff" size={16} />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                  {submit.isPending ? 'Enviando...' : 'Enviar respuesta'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {user?.role === 'TEACHER' && (
        <TouchableOpacity
          onPress={() => router.push(`/submissions/${id}` as `/${string}`)}
          style={{ backgroundColor: '#4F46E5', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        >
          <Users color="#fff" size={20} />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Ver respuestas de alumnos</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
      <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
