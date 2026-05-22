import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { BookOpen, Plus, X } from 'lucide-react-native';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { Course } from '../../lib/types';
import { extractApiError } from '../../utils/extractApiError';

export default function CoursesScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [enrollCode, setEnrollCode] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');

  const { data: courses = [], isLoading, refetch, isRefetching } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: () => api.get<Course[]>('/courses'),
  });

  const enroll = useMutation({
    mutationFn: () => api.post<Course>('/courses/enroll', { enrollCode }),
    onSuccess: () => { Alert.alert('¡Listo!', 'Te uniste al curso'); setShowModal(false); setEnrollCode(''); qc.invalidateQueries({ queryKey: ['courses'] }); },
    onError: (e: unknown) => Alert.alert('Error', extractApiError(e)),
  });

  const create = useMutation({
    mutationFn: () => api.post<Course>('/courses', { title: createTitle, description: createDesc }),
    onSuccess: () => { Alert.alert('Curso creado'); setShowModal(false); setCreateTitle(''); setCreateDesc(''); qc.invalidateQueries({ queryKey: ['courses'] }); },
    onError: (e: unknown) => Alert.alert('Error', extractApiError(e)),
  });

  const isTeacher = user?.role === 'TEACHER';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={courses}
        keyExtractor={c => c.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4F46E5" />}
        ListEmptyComponent={
          isLoading ? <ActivityIndicator style={{ marginTop: 40 }} color="#4F46E5" /> : (
            <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
              <BookOpen color={colors.textMuted} size={48} />
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>
                {isTeacher ? 'Crea tu primer curso' : 'Únete con un código de inscripción'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/course/[id]', params: { id: item.id } })}
            style={{ backgroundColor: colors.card, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          >
            <View style={{ width: 46, height: 46, borderRadius: 12, backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF', justifyContent: 'center', alignItems: 'center' }}>
              <BookOpen color="#4F46E5" size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.text, fontSize: 15 }}>{item.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 3 }} numberOfLines={2}>{item.description}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                {isTeacher ? `${item.studentCount} alumnos · Código: ${item.enrollCode}` : item.teacherName}
              </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={{ position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
      >
        <Plus color="#fff" size={26} />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, backgroundColor: colors.card, padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
              {isTeacher ? 'Crear curso' : 'Unirse a un curso'}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <X color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          {isTeacher ? (
            <>
              <Field label="Título del curso" value={createTitle} onChange={setCreateTitle} placeholder="Ej: Matemáticas 6º" colors={colors} />
              <Field label="Descripción" value={createDesc} onChange={setCreateDesc} placeholder="Descripción del curso..." multiline colors={colors} />
              <SubmitBtn label="Crear curso" loading={create.isPending} onPress={() => create.mutate()} />
            </>
          ) : (
            <>
              <Text style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 14 }}>Introduce el código que te dio tu profesor para inscribirte.</Text>
              <Field label="Código de inscripción" value={enrollCode} onChange={setEnrollCode} placeholder="Ej: ABC12345" colors={colors} />
              <SubmitBtn label="Unirse al curso" loading={enroll.isPending} onPress={() => enroll.mutate()} />
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  colors: {
    textSecondary: string;
    textMuted: string;
    text: string;
    inputBg: string;
    inputBorder: string;
  };
}

function Field({ label, value, onChange, placeholder, multiline, colors }: FieldProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.textMuted}
        multiline={multiline} numberOfLines={multiline ? 3 : 1}
        style={{ borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: colors.text, backgroundColor: colors.inputBg, textAlignVertical: multiline ? 'top' : 'center' }}
      />
    </View>
  );
}

interface SubmitBtnProps {
  label: string;
  loading: boolean;
  onPress: () => void;
}

function SubmitBtn({ label, loading, onPress }: SubmitBtnProps) {
  return (
    <TouchableOpacity onPress={onPress} disabled={loading}
      style={{ backgroundColor: loading ? '#A5B4FC' : '#4F46E5', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{loading ? 'Espera...' : label}</Text>
    </TouchableOpacity>
  );
}
