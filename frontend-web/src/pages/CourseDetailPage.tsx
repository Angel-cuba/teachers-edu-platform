import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Users,
  Hash,
  BookOpen,
  ClipboardList,
  Calendar,
  Lock,
  Unlock,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { Course, Exercise, User } from '../types';
import clsx from 'clsx';
import toast from 'react-hot-toast';

type Tab = 'exercises' | 'students';

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<Tab>('exercises');

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', isActive: true });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const { data } = await api.get<Course>(`/courses/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const { data: exercises, isLoading: exercisesLoading } = useQuery({
    queryKey: ['exercises', id],
    queryFn: async () => {
      const { data } = await api.get<Exercise[]>(`/courses/${id}/exercises`);
      return data;
    },
    enabled: !!id,
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['course-students', id],
    queryFn: async () => {
      const { data } = await api.get<User[]>(`/courses/${id}/students`);
      return data;
    },
    enabled: !!id && isTeacher && activeTab === 'students',
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; isActive: boolean }) => {
      const res = await api.put<Course>(`/courses/${id}`, data);
      return res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['course', id], updated);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso actualizado');
      setShowEdit(false);
    },
    onError: () => toast.error('Error al actualizar el curso'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Curso eliminado');
      navigate('/courses');
    },
    onError: () => toast.error('Error al eliminar el curso'),
  });

  const openEdit = () => {
    if (!course) return;
    setEditForm({ title: course.title, description: course.description ?? '', isActive: course.isActive });
    setShowEdit(true);
  };

  if (courseLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded-xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400 font-medium">Course not found</p>
        <Link to="/courses" className="text-indigo-600 dark:text-indigo-400 mt-2 inline-block text-sm">
          Back to courses
        </Link>
      </div>
    );
  }

  const visibleExercises = exercises;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          to="/courses"
          className="mt-1 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                course.isActive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {course.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{course.description}</p>
        </div>

        {isTeacher && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={openEdit}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-gray-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              title="Editar curso"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Eliminar curso"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
          <Users className="w-5 h-5 text-indigo-500" />
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Students</p>
            <p className="font-semibold text-gray-800 dark:text-gray-100">{course.studentCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Exercises</p>
            <p className="font-semibold text-gray-800 dark:text-gray-100">{exercises?.length ?? 0}</p>
          </div>
        </div>
        {isTeacher && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
            <Hash className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500">Enroll Code</p>
              <p className="font-semibold text-gray-800 dark:text-gray-100 font-mono tracking-wider">
                {course.enrollCode}
              </p>
            </div>
          </div>
        )}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-500" />
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Created</p>
            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
              {format(new Date(course.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {isTeacher && (
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {(['exercises', 'students'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px',
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Exercises tab */}
      {(!isTeacher || activeTab === 'exercises') && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Exercises</h2>
            {isTeacher && (
              <Link
                to={`/courses/${id}/exercises/new`}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Exercise
              </Link>
            )}
          </div>

          {exercisesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : visibleExercises && visibleExercises.length > 0 ? (
            <div className="space-y-3">
              {visibleExercises.map((exercise) => {
                const status = !isTeacher ? exercise.mySubmissionStatus : null;
                const borderClass =
                  status === 'GRADED'
                    ? 'border border-gray-100 dark:border-gray-700 border-l-4 border-l-emerald-400'
                    : status === 'PENDING'
                    ? 'border border-gray-100 dark:border-gray-700 border-l-4 border-l-amber-400'
                    : 'border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700';

                return (
                  <Link
                    key={exercise.id}
                    to={isTeacher ? `/exercises/${exercise.id}/submissions` : `/exercises/${exercise.id}`}
                    className={clsx(
                      'bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-all group',
                      borderClass
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5">
                        {exercise.isPublished ? (
                          <Unlock className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {exercise.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              exercise.type === 'CODE'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                : exercise.type === 'MULTIPLE_CHOICE'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {exercise.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{exercise.maxScore} pts</span>
                          {exercise.dueDate && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              Due {formatDistanceToNow(new Date(exercise.dueDate), { addSuffix: true })}
                            </span>
                          )}
                          {status === 'PENDING' && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Pendiente
                            </span>
                          )}
                          {status === 'GRADED' && (
                            <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              Calificado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      {isTeacher && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                          <ClipboardList className="w-3.5 h-3.5" />
                          Submissions
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-10 text-center">
              <ClipboardList className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No exercises yet</p>
              {isTeacher && (
                <Link
                  to={`/courses/${id}/exercises/new`}
                  className="mt-3 inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  <Plus className="w-4 h-4" /> Add the first exercise
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Students tab */}
      {isTeacher && activeTab === 'students' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Enrolled Students ({students?.length ?? 0})
          </h2>
          {studentsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 animate-pulse">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : students && students.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
              {students.map((student) => (
                <div key={student.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-semibold text-sm flex-shrink-0">
                    {student.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{student.displayName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{student.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-10 text-center">
              <Users className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No students enrolled yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                Share the enrollment code{' '}
                <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{course.enrollCode}</span>{' '}
                with your students
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Editar curso</h2>
              <button
                onClick={() => setShowEdit(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-y"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Curso activo (los alumnos pueden inscribirse)</span>
              </label>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowEdit(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => updateMutation.mutate(editForm)}
                disabled={updateMutation.isPending || !editForm.title.trim()}
                className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors text-sm flex items-center justify-center gap-2"
              >
                {updateMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">¿Eliminar curso?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              Se eliminarán todos los ejercicios y entregas de{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-300">"{course.title}"</span>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-60 transition-colors text-sm flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage;
