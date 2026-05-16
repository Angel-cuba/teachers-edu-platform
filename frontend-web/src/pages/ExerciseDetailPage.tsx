import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { BookOpen, Send, CheckCircle, ArrowLeft, Hourglass, Lock } from 'lucide-react'
import api from '../api/axios'
import { extractErrorMessage } from '../api/errorMessage'
import { useAuth } from '../hooks/useAuth'
import type { Exercise, Submission } from '../types'

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [answer, setAnswer] = useState('')

  const { data: exercise, isLoading } = useQuery<Exercise>({
    queryKey: ['exercise', id],
    queryFn: () => api.get(`/exercises/${id}`).then(r => r.data),
  })

  const { data: mySubmissions } = useQuery<Submission[]>({
    queryKey: ['submissions', id, 'mine'],
    queryFn: () => api.get(`/exercises/${id}/submissions`).then(r => r.data),
    enabled: user?.role === 'STUDENT',
  })

  const mySubmission = mySubmissions?.[0]

  const submit = useMutation({
    mutationFn: (answer: string) =>
      api.post(`/exercises/${id}/submit`, { answer }).then(r => r.data),
    onSuccess: () => {
      toast.success('Respuesta enviada')
      qc.invalidateQueries({ queryKey: ['submissions', id] })
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Error al enviar')),
  })

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
  if (!exercise) return <div className="p-6 text-red-500">Ejercicio no encontrado</div>

  const isOverdue = !!exercise.dueDate && new Date(exercise.dueDate) < new Date()

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg">
            <BookOpen className="text-indigo-600 dark:text-indigo-400" size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{exercise.title}</h1>
              <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium">
                {exercise.type}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Puntuación máxima: {exercise.maxScore} pts</p>
            {exercise.dueDate && (
              <p className={`text-sm mt-1 ${isOverdue ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-orange-500 dark:text-orange-400'}`}>
                {isOverdue ? 'Vencido' : 'Entrega'}: {new Date(exercise.dueDate).toLocaleDateString()}</p>
            )}
          </div>
        </div>
        <div className="mt-4 prose max-w-none text-gray-700 dark:text-gray-300">
          <p className="whitespace-pre-wrap">{exercise.description}</p>
        </div>
      </div>

      {user?.role === 'STUDENT' && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Tu respuesta</h2>

            {mySubmission ? (
              <div className="space-y-4">
                {/* ── Awaiting grading banner ── */}
                {mySubmission.status === 'PENDING' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4"
                  >
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                      <Hourglass size={16} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Respuesta enviada — en espera de corrección</p>
                      <p className="text-amber-700/80 dark:text-amber-400/80 text-xs mt-0.5">
                        Tu profesor revisará y calificará tu respuesta. Recibirás una notificación cuando esté lista.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── Graded banner ── */}
                {mySubmission.status === 'GRADED' && mySubmission.grade && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700/50 rounded-xl p-4 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">Calificado</p>
                    </div>
                    <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                      {mySubmission.grade.score} <span className="text-base font-medium text-emerald-600/70 dark:text-emerald-400/70">/ {exercise.maxScore} pts</span>
                    </p>
                    {mySubmission.grade.feedback && (
                      <p className="text-emerald-700 dark:text-emerald-400 text-sm italic border-t border-emerald-200 dark:border-emerald-700/50 pt-2 mt-2">
                        "{mySubmission.grade.feedback}"
                      </p>
                    )}
                  </motion.div>
                )}

                {/* ── Submitted answer ── */}
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Tu respuesta</p>
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">{mySubmission.answer}</p>
                </div>
              </div>
            ) : isOverdue ? (
              /* ── Plazo vencido — sin entrega ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700/50 rounded-xl p-4"
              >
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                  <Lock size={16} className="text-red-500 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-300 text-sm">Plazo de entrega vencido</p>
                  <p className="text-red-600/80 dark:text-red-400/80 text-xs mt-0.5">
                    La fecha límite ya pasó. Este ejercicio no puede ser entregado y quedará sin evaluación.
                  </p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); submit.mutate(answer) }} className="space-y-4">
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  rows={6}
                  required
                  placeholder="Escribe tu respuesta aquí..."
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
                <button
                  type="submit"
                  disabled={submit.isPending || !answer.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  <Send size={16} />
                  {submit.isPending ? 'Enviando...' : 'Enviar respuesta'}
                </button>
              </form>
            )}
          </div>
      )}

      {user?.role === 'TEACHER' && (
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/exercises/${id}/submissions`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Ver respuestas de alumnos
          </button>
        </div>
      )}
    </motion.div>
  )
}
