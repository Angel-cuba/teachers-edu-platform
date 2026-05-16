import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Clock, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import api from '../api/axios'
import type { Submission } from '../types'

export default function SubmissionsPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>()
  const navigate = useNavigate()

  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ['submissions', exerciseId],
    queryFn: () => api.get(`/exercises/${exerciseId}/submissions`).then(r => r.data),
  })

  const pending = submissions.filter(s => s.status === 'PENDING').length
  const graded = submissions.filter(s => s.status === 'GRADED').length

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Respuestas de alumnos</h1>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400"><Clock size={14} /> {pending} pendientes</span>
          <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400"><CheckCircle size={14} /> {graded} calificadas</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
      ) : submissions.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center text-gray-400 dark:text-gray-500">
          <User size={40} className="mx-auto mb-3 opacity-40" />
          <p>Ningún alumno ha respondido todavía</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium">Alumno</th>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium">Enviado</th>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium">Estado</th>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium">Puntuación</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {submissions.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25 }}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{s.studentName}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(s.submittedAt), { addSuffix: true, locale: es })}
                  </td>
                  <td className="px-6 py-4">
                    {s.status === 'GRADED' ? (
                      <span className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                        <CheckCircle size={14} /> Calificada
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400">
                        <Clock size={14} /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {s.grade ? `${s.grade.score} pts` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/submissions/${s.id}/grade`}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                    >
                      {s.status === 'GRADED' ? 'Ver / Editar' : 'Calificar →'}
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}
