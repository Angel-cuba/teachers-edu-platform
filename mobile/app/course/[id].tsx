import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, RefreshControl, ScrollView, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Users, X, Info, ExternalLink, Pencil, Trash2 } from 'lucide-react-native';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { Course, Exercise } from '../../lib/types';
import { extractApiError } from '../../utils/extractApiError';

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:5173';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  // Create exercise state
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxScore, setMaxScore] = useState('100');

  // Edit course state
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editActive, setEditActive] = useState(true);

  const [tab, setTab] = useState<'exercises' | 'students'>('exercises');

  const { data: course, isLoading: loadingCourse } = useQuery<Course>({
    queryKey: ['course', id],
    queryFn: () => api.get<Course>(`/courses/${id}`),
  });

  const { data: exercises = [], isLoading: loadingEx, refetch: refetchEx } = useQuery<Exercise[]>({
    queryKey: ['exercises', id],
    queryFn: () => api.get<Exercise[]>(`/courses/${id}/exercises`),
  });

  const createEx = useMutation({
    mutationFn: () => api.post(`/courses/${id}/exercises`, { title, description, type: 'OPEN', maxScore: Number(maxScore), isPublished: false }),
    onSuccess: () => {
      Alert.alert('Ejercicio creado');
      setShowCreate(false); setTitle(''); setDescription('');
      qc.invalidateQueries({ queryKey: ['exercises', id] });
    },
    onError: (e: unknown) => Alert.alert('Error', extractApiError(e)),
  });

  const updateCourse = useMutation({
    mutationFn: () => api.put<Course>(`/courses/${id}`, { title: editTitle, description: editDescription, isActive: editActive }),
    onSuccess: (updated) => {
      qc.setQueryData(['course', id], updated);
      qc.invalidateQueries({ queryKey: ['courses'] });
      setShowEdit(false);
      Alert.alert('Curso actualizado');
    },
    onError: (e: unknown) => Alert.alert('Error', extractApiError(e)),
  });

  const deleteCourse = useMutation({
    mutationFn: () => api.delete(`/courses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      router.replace('/(tabs)/courses');
    },
    onError: (e: unknown) => Alert.alert('Error', extractApiError(e)),
  });

  const openEdit = () => {
    if (!course) return;
    setEditTitle(course.title);
    setEditDescription(course.description ?? '');
    setEditActive(course.isActive ?? true);
    setShowEdit(true);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar curso',
      `¿Seguro que quieres eliminar "${course?.title}"? Se eliminarán todos sus ejercicios y entregas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteCourse.mutate() },
      ]
    );
  };

  const isTeacher = user?.role === 'TEACHER';

  if (loadingCourse) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#4F46E5" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#4F46E5', padding: 20, paddingTop: 8, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{course?.title}</Text>
            <Text style={{ color: '#C7D2FE', marginTop: 4, fontSize: 14 }} numberOfLines={2}>{course?.description}</Text>
          </View>
          {isTeacher && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
              <TouchableOpacity
                onPress={openEdit}
                style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}
              >
                <Pencil color="#fff" size={16} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDelete}
                style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.25)', justifyContent: 'center', alignItems: 'center' }}
              >
                <Trash2 color="#FCA5A5" size={16} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isTeacher && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <Text style={{ color: '#A5B4FC', fontSize: 13 }}>Código: </Text>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              {course?.enrollCode}
            </Text>
          </View>
        )}
        {isTeacher && (
          <TouchableOpacity
            onPress={() => Linking.openURL(`${WEB_URL}/courses/${id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Info color="#C7D2FE" size={14} />
            <Text style={{ color: '#C7D2FE', fontSize: 12, flex: 1 }}>
              Gestión avanzada disponible en la versión web
            </Text>
            <ExternalLink color="#A5B4FC" size={13} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={exercises}
        keyExtractor={e => e.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetchEx} tintColor="#4F46E5" />}
        ListHeaderComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontWeight: '700', color: '#374151', fontSize: 15 }}>Ejercicios ({exercises.length})</Text>
          </View>
        }
        ListEmptyComponent={
          loadingEx ? <ActivityIndicator style={{ marginTop: 20 }} color="#4F46E5" /> : (
            <View style={{ alignItems: 'center', paddingTop: 40, gap: 10 }}>
              <BookOpen color="#D1D5DB" size={40} />
              <Text style={{ color: '#9CA3AF' }}>
                {isTeacher ? 'Aún no hay ejercicios. Crea el primero.' : 'No hay ejercicios publicados aún.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const status = !isTeacher ? item.mySubmissionStatus : null;
          const leftBorderColor =
            status === 'GRADED' ? '#10B981' :
            status === 'PENDING' ? '#F59E0B' :
            'transparent';

          return (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: item.id } })}
            style={{
              backgroundColor: '#fff',
              borderRadius: 14,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderTopWidth: 1,
              borderRightWidth: 1,
              borderBottomWidth: 1,
              borderTopColor: '#F3F4F6',
              borderRightColor: '#F3F4F6',
              borderBottomColor: '#F3F4F6',
              borderLeftWidth: status ? 4 : 1,
              borderLeftColor: status ? leftBorderColor : '#F3F4F6',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: '#111827', fontSize: 14 }}>{item.title}</Text>
              <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 3 }} numberOfLines={2}>{item.description}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <Badge label={item.type} color="#6B7280" bg="#F3F4F6" />
                <Badge label={`${item.maxScore} pts`} color="#4F46E5" bg="#EEF2FF" />
                {!item.isPublished && <Badge label="Borrador" color="#D97706" bg="#FFFBEB" />}
                {status === 'PENDING' && <Badge label="Pendiente" color="#D97706" bg="#FFFBEB" />}
                {status === 'GRADED' && <Badge label="Calificado" color="#059669" bg="#ECFDF5" />}
              </View>
            </View>
            <Text style={{ color: '#9CA3AF', fontSize: 18 }}>›</Text>
          </TouchableOpacity>
          );
        }}
      />

      {isTeacher && (
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          style={{ position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
        >
          <Plus color="#fff" size={26} />
        </TouchableOpacity>
      )}

      {/* ── Create Exercise Modal ── */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCreate(false)}>
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Nuevo ejercicio</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}><X color="#6B7280" size={24} /></TouchableOpacity>
          </View>

          {/* Web reminder banner */}
          <TouchableOpacity
            onPress={() => Linking.openURL(`${WEB_URL}/courses/${id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EEF2FF', borderRadius: 12, padding: 12, marginBottom: 20 }}
          >
            <Info color="#4F46E5" size={16} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#3730A3' }}>Opciones avanzadas en web</Text>
              <Text style={{ fontSize: 11, color: '#6366F1', marginTop: 1 }}>
                Fecha límite, tipo y publicación directa están disponibles en la versión web.
              </Text>
            </View>
            <ExternalLink color="#6366F1" size={14} />
          </TouchableOpacity>

          <Field label="Título" value={title} onChange={setTitle} placeholder="Ej: Problema de álgebra" />
          <Field label="Enunciado" value={description} onChange={setDescription} placeholder="Describe el ejercicio..." multiline />
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Puntuación máxima</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {['5', '10', '20', '50', '100'].map(preset => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => setMaxScore(preset)}
                  style={{
                    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                    borderWidth: 1.5,
                    borderColor: maxScore === preset ? '#4F46E5' : '#E5E7EB',
                    backgroundColor: maxScore === preset ? '#EEF2FF' : '#F9FAFB',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: maxScore === preset ? '#4F46E5' : '#6B7280' }}>
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              value={maxScore}
              onChangeText={setMaxScore}
              keyboardType="numeric"
              placeholder="O escribe un valor"
              placeholderTextColor="#9CA3AF"
              style={{ borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#111827' }}
            />
          </View>
          <TouchableOpacity
            onPress={() => createEx.mutate()}
            disabled={createEx.isPending || !title}
            style={{ backgroundColor: createEx.isPending ? '#A5B4FC' : '#4F46E5', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{createEx.isPending ? 'Creando...' : 'Crear ejercicio'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Edit Course Modal ── */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEdit(false)}>
        <View style={{ flex: 1, backgroundColor: '#fff', padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Editar curso</Text>
            <TouchableOpacity onPress={() => setShowEdit(false)}><X color="#6B7280" size={24} /></TouchableOpacity>
          </View>

          <Field label="Título" value={editTitle} onChange={setEditTitle} placeholder="Título del curso" />
          <Field label="Descripción" value={editDescription} onChange={setEditDescription} placeholder="Descripción del curso..." multiline />

          <TouchableOpacity
            onPress={() => setEditActive(a => !a)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1.5, borderColor: editActive ? '#4F46E5' : '#E5E7EB', borderRadius: 12, backgroundColor: editActive ? '#EEF2FF' : '#F9FAFB', marginBottom: 16 }}
          >
            <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: editActive ? '#4F46E5' : '#D1D5DB', backgroundColor: editActive ? '#4F46E5' : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
              {editActive && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: editActive ? '#3730A3' : '#374151' }}>Curso activo</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>Los alumnos pueden inscribirse con el código</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => updateCourse.mutate()}
            disabled={updateCourse.isPending || !editTitle.trim()}
            style={{ backgroundColor: updateCourse.isPending ? '#A5B4FC' : '#4F46E5', borderRadius: 12, paddingVertical: 15, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
              {updateCourse.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Text>
          </TouchableOpacity>
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
  keyboard?: 'default' | 'numeric' | 'email-address';
}

function Field({ label, value, onChange, placeholder, multiline, keyboard }: FieldProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#9CA3AF"
        multiline={multiline} numberOfLines={multiline ? 3 : 1} keyboardType={keyboard || 'default'}
        style={{ borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#111827', textAlignVertical: multiline ? 'top' : 'center' }}
      />
    </View>
  );
}

interface BadgeProps { label: string; color: string; bg: string; }

function Badge({ label, color, bg }: BadgeProps) {
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}
