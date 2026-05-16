import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ClipboardCheck, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import api from '../api/axios'
import type { Submission } from '../types'

export default function PendingGradesPage() {
  const navigate = useNavigate()

  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ['pending-submissions'],
    queryFn: () => api.get('/submissions/pending').then(r => r.data),
  })

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
          <ClipboardCheck className="text-amber-600 dark:text-amber-400" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pendientes de calificar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isLoading ? '…' : `${submissions.length} respuesta${submissions.length !== 1 ? 's' : ''} esperando calificación`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <ClipboardCheck size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">¡Todo al día!</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">No hay respuestas pendientes de calificar</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium">Alumno</th>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium">Ejercicio</th>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium">Enviado</th>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                        <User size={13} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{s.studentName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {s.exerciseTitle || '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(s.submittedAt), { addSuffix: true, locale: es })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/submissions/${s.id}/grade`}
                      className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ClipboardCheck size={13} /> Calificar
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
