import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Users, ClipboardCheck, Clock, ArrowRight, Hourglass } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { Course, Exercise } from '../types';

interface TeacherStats {
  totalStudents: number;
  pendingGrades: number;
  totalCourses: number;
  totalExercises: number;
}

interface StudentStats {
  enrolledCourses: number;
  pendingExercises: number;
  completedSubmissions: number;
}

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  to?: string;
  index?: number;
}> = ({ label, value, icon, color, to, index = 0 }) => {
  const inner = (
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );

  const base = 'bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 transition-all';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3, ease: 'easeOut' }}
    >
      {to ? (
        <Link
          to={to}
          className={`${base} hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 cursor-pointer block`}
        >
          {inner}
        </Link>
      ) : (
        <div className={base}>{inner}</div>
      )}
    </motion.div>
  );
};

const TeacherDashboard: React.FC = () => {
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: async () => {
      const { data } = await api.get<Course[]>('/courses/my');
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: async () => {
      const { data } = await api.get<TeacherStats>('/dashboard/stats');
      return data;
    },
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Overview of your courses and students</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          index={0}
          label="My Courses"
          value={stats?.totalCourses ?? courses?.length ?? 0}
          icon={<BookOpen className="w-6 h-6 text-indigo-600" />}
          color="bg-indigo-50 dark:bg-indigo-950/40"
          to="/courses"
        />
        <StatCard
          index={1}
          label="Total Students"
          value={stats?.totalStudents ?? 0}
          icon={<Users className="w-6 h-6 text-emerald-600" />}
          color="bg-emerald-50 dark:bg-emerald-950/40"
          to="/courses"
        />
        <StatCard
          index={2}
          label="Pending Grades"
          value={stats?.pendingGrades ?? 0}
          icon={<ClipboardCheck className="w-6 h-6 text-amber-600" />}
          color="bg-amber-50 dark:bg-amber-950/40"
          to="/submissions/pending"
        />
        <StatCard
          index={3}
          label="Exercises"
          value={stats?.totalExercises ?? 0}
          icon={<Clock className="w-6 h-6 text-purple-600" />}
          color="bg-purple-50 dark:bg-purple-950/40"
          to="/courses"
        />
      </div>

      {/* Recent courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Your Courses</h2>
          <Link
            to="/courses"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {coursesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full mb-4" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 6).map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.3 }}
              >
                <Link
                  to={`/courses/${course.id}`}
                  className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {course.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        course.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {course.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{course.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {course.studentCount} students
                    </span>
                    <span>{formatDistanceToNow(new Date(course.createdAt), { addSuffix: true })}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No courses yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create your first course to get started</p>
            <Link
              to="/courses/new"
              className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Create a course
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const StudentDashboard: React.FC = () => {
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['student-courses'],
    queryFn: async () => {
      const { data } = await api.get<Course[]>('/courses/enrolled');
      return data;
    },
  });

  const { data: pendingExercises, isLoading: exercisesLoading } = useQuery({
    queryKey: ['student-pending-exercises'],
    queryFn: async () => {
      const { data } = await api.get<Exercise[]>('/exercises/pending');
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['student-stats'],
    queryFn: async () => {
      const { data } = await api.get<StudentStats>('/dashboard/stats');
      return data;
    },
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Your learning progress at a glance</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          index={0}
          label="Enrolled Courses"
          value={stats?.enrolledCourses ?? courses?.length ?? 0}
          icon={<BookOpen className="w-6 h-6 text-indigo-600" />}
          color="bg-indigo-50"
        />
        <StatCard
          index={1}
          label="Pending Exercises"
          value={stats?.pendingExercises ?? pendingExercises?.length ?? 0}
          icon={<Clock className="w-6 h-6 text-amber-600" />}
          color="bg-amber-50"
        />
        <StatCard
          index={2}
          label="Completed"
          value={stats?.completedSubmissions ?? 0}
          icon={<ClipboardCheck className="w-6 h-6 text-emerald-600" />}
          color="bg-emerald-50"
        />
      </div>

      {/* Pending exercises */}
      {!exercisesLoading && pendingExercises && pendingExercises.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Pending Exercises</h2>
          <div className="space-y-3">
            {pendingExercises.slice(0, 5).map((exercise) => {
              const isPending = exercise.mySubmissionStatus === 'PENDING';
              return (
                <Link
                  key={exercise.id}
                  to={`/exercises/${exercise.id}`}
                  className={`rounded-xl border p-4 flex items-center justify-between hover:shadow-sm transition-all group ${
                    isPending
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700/50 hover:border-amber-300 dark:hover:border-amber-600'
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium transition-colors ${
                        isPending
                          ? 'text-amber-900 dark:text-amber-200 group-hover:text-amber-700 dark:group-hover:text-amber-300'
                          : 'text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                      }`}>
                        {exercise.title}
                      </h3>
                      {isPending && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-medium">
                          <Hourglass size={10} />
                          Submitted
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                      <span
                        className={`px-1.5 py-0.5 rounded font-medium ${
                          exercise.type === 'CODE'
                            ? 'bg-purple-50 text-purple-700'
                            : exercise.type === 'MULTIPLE_CHOICE'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {exercise.type.replace('_', ' ')}
                      </span>
                      {exercise.dueDate && (
                        <span>Due {formatDistanceToNow(new Date(exercise.dueDate), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-colors ${
                    isPending
                      ? 'text-amber-400 dark:text-amber-500 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                      : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                  }`} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Enrolled courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">My Courses</h2>
          <Link
            to="/courses"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {coursesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full mb-4" />
                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 6).map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.3 }}
              >
                <Link
                  to={`/courses/${course.id}`}
                  className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{course.description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">by {course.teacherName}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No courses enrolled</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Join a course using an enrollment code</p>
            <Link
              to="/courses"
              className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Browse courses
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'TEACHER' || user?.role === 'ADMIN') {
    return <TeacherDashboard />;
  }
  return <StudentDashboard />;
};

export default DashboardPage;
