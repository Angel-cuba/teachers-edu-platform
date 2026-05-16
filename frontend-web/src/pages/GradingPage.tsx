import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, CheckCircle, ImageIcon, BookOpen, User, MessageSquare, Award } from 'lucide-react'
import api from '../api/axios'
import { extractErrorMessage } from '../api/errorMessage'
import type { Submission, Exercise } from '../types'

const easeOut = 'easeOut' as const
function fadeUp(i: number) {
  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.08, duration: 0.35, ease: easeOut },
  }
}

export default function GradingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [imgError, setImgError] = useState(false)

  const { data: submission, isLoading: loadingSub } = useQuery<Submission>({
    queryKey: ['submission', id],
    queryFn: () => api.get(`/submissions/${id}`).then(r => r.data),
  })

  const { data: exercise } = useQuery<Exercise>({
    queryKey: ['exercise', submission?.exerciseId],
    queryFn: () => api.get(`/exercises/${submission!.exerciseId}`).then(r => r.data),
    enabled: !!submission?.exerciseId,
  })

  useEffect(() => {
    if (submission?.grade) {
      setScore(String(submission.grade.score))
      setFeedback(submission.grade.feedback || '')
    }
  }, [submission])

  const grade = useMutation({
    mutationFn: () =>
      api.post(`/submissions/${id}/grade`, { score: Number(score), feedback }).then(r => r.data),
    onSuccess: () => {
      toast.success('Calificación guardada')
      qc.invalidateQueries({ queryKey: ['submission', id] })
      qc.invalidateQueries({ queryKey: ['submissions', submission?.exerciseId] })
      qc.invalidateQueries({ queryKey: ['pending-submissions'] })
      navigate(-1)
    },
    onError: (e: unknown) => toast.error(extractErrorMessage(e, 'Error al calificar')),
  })

  if (loadingSub) return (
    <div className="flex justify-center items-center min-h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  )
  if (!submission) return <div className="p-6 text-red-500">Respuesta no encontrada</div>

  const maxScore = exercise?.maxScore ?? 1000
  const scoreNum = Number(score)
  const scoreValid = score !== '' && scoreNum >= 0 && scoreNum <= maxScore
  const scorePercent = score === '' ? null : scoreValid ? Math.round((scoreNum / maxScore) * 100) : -1
  const scoreColor =
    scorePercent === null ? '' :
    scorePercent < 0 ? 'text-red-500 dark:text-red-400' :
    scorePercent >= 70 ? 'text-emerald-600 dark:text-emerald-400' :
    scorePercent >= 40 ? 'text-amber-600 dark:text-amber-400' :
    'text-red-500 dark:text-red-400'

  const card = 'bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800'

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <ArrowLeft size={16} /> Volver a respuestas
      </motion.button>

      <div className="space-y-5">
        {/* ── Exercise context ── */}
        {exercise && (
          <motion.div {...fadeUp(0)} className={`${card} p-6 space-y-5`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
                <BookOpen size={16} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                Contexto del ejercicio
              </h2>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Enunciado</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {exercise.description}
              </p>
            </div>

            {exercise.attachmentUrl && (
              <div>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <ImageIcon size={11} /> Imagen adjunta
                </p>
                {!imgError ? (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <img
                      src={exercise.attachmentUrl}
                      alt="Exercise attachment"
                      className="max-h-72 w-full object-contain"
                      onError={() => setImgError(true)}
                    />
                  </div>
                ) : (
                  <a href={exercise.attachmentUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-indigo-600 dark:text-indigo-400 underline break-all">
                    {exercise.attachmentUrl}
                  </a>
                )}
              </div>
            )}

            {exercise.correctAnswer && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 p-4">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <CheckCircle size={12} /> Respuesta modelo
                  <span className="normal-case font-normal text-emerald-600/70 dark:text-emerald-500/70 ml-1">(solo visible al profesor)</span>
                </p>
                <p className="text-sm text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed font-mono bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg px-3 py-2">
                  {exercise.correctAnswer}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Student answer ── */}
        <motion.div {...fadeUp(1)} className={`${card} p-6 space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
                <User size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">Respuesta del alumno</h1>
            </div>
            <span className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full">
              {submission.studentName}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
              {submission.answer}
            </p>
          </div>
        </motion.div>

        {/* ── Grade form ── */}
        <motion.div {...fadeUp(2)} className={`${card} p-6`}>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
              <Star size={16} className="text-amber-500" />
            </div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Calificación</h2>
          </div>

          <form onSubmit={e => { e.preventDefault(); grade.mutate() }} className="space-y-5">
            {/* Score input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Puntuación{' '}
                <span className="text-gray-400 dark:text-gray-500 font-normal">(0 – {maxScore})</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={score}
                  onChange={e => setScore(e.target.value)}
                  min={0}
                  max={maxScore}
                  required
                  placeholder={`Ej: ${exercise ? Math.round(exercise.maxScore * 0.8) : 80}`}
                  className="w-36 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {scorePercent !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Award size={16} className={scoreColor} />
                    <span className={`text-sm font-semibold ${scoreColor}`}>
                      {scorePercent < 0 ? `Máx. ${maxScore}` : `${scorePercent}%`}
                    </span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Feedback textarea */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MessageSquare size={14} />
                Comentarios{' '}
                <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
              </label>
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={4}
                placeholder="Añade correcciones o sugerencias para el alumno..."
                className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y placeholder-gray-400 dark:placeholder-gray-600"
              />
            </div>

            <button
              type="submit"
              disabled={grade.isPending || !scoreValid}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 text-white px-8 py-3 rounded-xl text-sm font-semibold disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {grade.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Guardando...
                </>
              ) : (
                <>
                  <Star size={15} />
                  Guardar calificación
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
