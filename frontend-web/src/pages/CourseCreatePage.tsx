import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Course } from '../types';

const CourseCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: '',
    description: '',
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const { data: course } = await api.post<Course>('/courses', data);
      return course;
    },
    onSuccess: (course) => {
      toast.success('Course created successfully!');
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      navigate(`/courses/${course.id}`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create course';
      toast.error(msg);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Course title is required');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Course description is required');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/courses"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Course</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Fill in the details for your new course</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Introduction to Python"
              required
              maxLength={200}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{form.title.length}/200</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe what students will learn in this course..."
              required
              rows={5}
              maxLength={2000}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-y"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{form.description.length}/2000</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Link
              to="/courses"
              className="flex-1 text-center px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {mutation.isPending && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {mutation.isPending ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseCreatePage;
