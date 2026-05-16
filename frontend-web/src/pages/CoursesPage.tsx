import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Users, Hash, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { extractErrorMessage } from '../api/errorMessage';
import { Course } from '../types';
import { useLang } from '../contexts/LanguageContext';

const CoursesPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLang();
  const queryClient = useQueryClient();
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const [enrollCode, setEnrollCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const endpoint = isTeacher ? '/courses/my' : '/courses/enrolled';

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', isTeacher ? 'my' : 'enrolled'],
    queryFn: async () => {
      const { data } = await api.get<Course[]>(endpoint);
      return data;
    },
  });

  const enrollMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data } = await api.post<Course>('/courses/enroll', { enrollCode: code });
      return data;
    },
    onSuccess: (course) => {
      toast.success(`Enrolled in "${course.title}"!`);
      setEnrollCode('');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err, 'Invalid enrollment code')),
  });

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollCode.trim()) {
      toast.error('Please enter an enrollment code');
      return;
    }
    enrollMutation.mutate(enrollCode.trim());
  };

  const filtered = courses?.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isTeacher ? t.courses.title_teacher : t.courses.title_student}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isTeacher ? t.courses.subtitle_teacher : t.courses.subtitle_student}
          </p>
        </div>
        {isTeacher && (
          <Link
            to="/courses/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.courses.newCourse}
          </Link>
        )}
      </div>

      {/* Student: enroll form */}
      {!isTeacher && (
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl p-4">
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-3">{t.courses.enrollCode}</p>
          <form onSubmit={handleEnroll} className="flex gap-2">
            <input
              type="text"
              value={enrollCode}
              onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
              placeholder={t.courses.enrollPlaceholder}
              className="flex-1 px-3 py-2 border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-400 dark:placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={enrollMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2 transition-colors"
            >
              {enrollMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {t.courses.join}
            </button>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.courses.searchPlaceholder}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Courses grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full mb-1" />
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-5/6 mb-4" />
              <div className="flex gap-4">
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-20" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className={`rounded-xl border p-5 transition-all group flex flex-col ${
                !isTeacher && !course.isActive
                  ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-60 grayscale hover:opacity-75'
                  : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className={`font-semibold leading-snug transition-colors ${
                  !isTeacher && !course.isActive
                    ? 'text-gray-500 dark:text-gray-500'
                    : 'text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                }`}>
                  {course.title}
                </h3>
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    course.isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {course.isActive ? t.common.active : t.common.inactive}
                </span>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 flex-1">
                {course.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mt-auto">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {course.studentCount}
                  </span>
                  {isTeacher && (
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5" />
                      {course.enrollCode}
                    </span>
                  )}
                </div>
                <span>
                  {formatDistanceToNow(new Date(course.createdAt), { addSuffix: true })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
            {searchQuery ? t.courses.noSearch : t.courses.noCoursesTitle}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            {isTeacher ? t.courses.noCourses_teacher : t.courses.noCourses_student}
          </p>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
