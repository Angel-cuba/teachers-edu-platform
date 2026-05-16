import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '../api/axios'
import type { Submission } from '../types'

export default function MyResultsPage() {
  const { data: submissions = [], isLoading } = useQuery<Submission[]>({
    queryKey: ['my-results'],
    queryFn: () => api.get('/submissions/my').then(r => r.data),
  })

  const graded = submissions.filter(s => s.status === 'GRADED')
  const avgScore = graded.length > 0
    ? Math.round(graded.reduce((acc, s) => acc + (s.grade?.score ?? 0), 0) / graded.length)
    : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis resultados</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total de entregas</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{submissions.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Calificadas</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{graded.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"><TrendingUp size={14} /> Promedio</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{avgScore !== null ? `${avgScore} pts` : '—'}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
      ) : submissions.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center text-gray-400 dark:text-gray-500">
          <p className="text-lg">Aún no has entregado ningún ejercicio</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium">Ejercicio</th>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium">Entregado</th>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium">Estado</th>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium">Puntuación</th>
                <th className="text-left px-6 py-3 text-gray-500 dark:text-gray-400 font-medium">Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {submissions.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{s.exerciseTitle || '—'}</td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(s.submittedAt), { addSuffix: true, locale: es })}
                  </td>
                  <td className="px-6 py-4">
                    {s.status === 'GRADED' ? (
                      <span className="flex items-center gap-1.5 text-green-700 dark:text-green-400"><CheckCircle size={14} /> Calificada</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-yellow-700 dark:text-yellow-400"><Clock size={14} /> Pendiente</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">
                    {s.grade ? `${s.grade.score} pts` : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {s.grade?.feedback || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
