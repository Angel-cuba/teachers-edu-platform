import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, ImageIcon, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { Course, Exercise } from '../types';
import { extractErrorMessage } from '../api/errorMessage';

const ExerciseCreatePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'OPEN' as 'MULTIPLE_CHOICE' | 'OPEN' | 'CODE',
    correctAnswer: '',
    attachmentUrl: '',
    maxScore: 100,
    dueDate: '',
    isPublished: false,
  });

  const [imgError, setImgError] = useState(false);

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const { data } = await api.get<Course>(`/courses/${courseId}`);
      return data;
    },
    enabled: !!courseId,
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const payload = {
        ...data,
        correctAnswer: data.correctAnswer || undefined,
        attachmentUrl: data.attachmentUrl || undefined,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      };
      const { data: exercise } = await api.post<Exercise>(
        `/courses/${courseId}/exercises`,
        payload
      );
      return exercise;
    },
    onSuccess: (exercise) => {
      toast.success('Exercise created!');
      queryClient.invalidateQueries({ queryKey: ['exercises', courseId] });
      navigate(`/exercises/${exercise.id}/submissions`);
    },
    onError: (err: unknown) => toast.error(extractErrorMessage(err, 'Failed to create exercise')),
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    // Reset image error when URL changes
    if (name === 'attachmentUrl') setImgError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    if (form.maxScore < 1 || form.maxScore > 1000) { toast.error('Max score must be between 1 and 1000'); return; }
    mutation.mutate(form);
  };

  const inputCls = 'w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm placeholder-gray-400 dark:placeholder-gray-500';
  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/courses/${courseId}`}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-0.5">
            <BookOpen className="w-4 h-4" />
            {course ? course.title : <span className="w-32 h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse inline-block" />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Exercise</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5">Add a new exercise to this course</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Title */}
          <div>
            <label className={labelCls}>Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Variables and Data Types"
              required
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description / Instructions <span className="text-red-500">*</span></label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the exercise, provide context, and list any specific requirements..."
              required
              rows={5}
              className={inputCls + ' resize-y'}
            />
          </div>

          {/* Type + MaxScore */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Exercise Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="OPEN">Open Answer</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="CODE">Code</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Max Score</label>
              <input
                type="number"
                name="maxScore"
                value={form.maxScore}
                onChange={handleChange}
                min={1}
                max={1000}
                required
                className={inputCls}
              />
            </div>
          </div>

          {/* Correct Answer */}
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Correct Answer <span className="text-gray-400 font-normal">(optional — only visible to teachers)</span>
              </span>
            </label>
            <textarea
              name="correctAnswer"
              value={form.correctAnswer}
              onChange={handleChange}
              placeholder="Model answer or key points the student should cover..."
              rows={3}
              className={inputCls + ' resize-y'}
            />
          </div>

          {/* Attachment URL */}
          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                Attachment URL <span className="text-gray-400 font-normal">(optional image or resource)</span>
              </span>
            </label>
            <input
              type="url"
              name="attachmentUrl"
              value={form.attachmentUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.png"
              className={inputCls}
            />
            {/* Image preview */}
            {form.attachmentUrl && !imgError && (
              <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-h-64">
                <img
                  src={form.attachmentUrl}
                  alt="Attachment preview"
                  className="w-full object-contain max-h-64"
                  onError={() => setImgError(true)}
                />
              </div>
            )}
            {form.attachmentUrl && imgError && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">⚠️ Could not load image preview — URL may not point to a valid image.</p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className={labelCls}>Due Date <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="datetime-local"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              className={inputCls}
            />
          </div>

          {/* Publish toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              checked={form.isPublished}
              onChange={handleChange}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isPublished" className="text-sm text-gray-700 dark:text-gray-300">
              Publish immediately (students can see and submit)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              to={`/courses/${courseId}`}
              className="flex-1 text-center px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
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
              {mutation.isPending ? 'Creating...' : 'Create Exercise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExerciseCreatePage;
