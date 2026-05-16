import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import api from '../api/axios'
import type { Notification } from '../types'

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
  })

  const markAllRead = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      toast.success('Todas marcadas como leídas')
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = notifications.filter(n => !n.isRead).length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
          {unread > 0 && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{unread} sin leer</p>}
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-medium"
          >
            <CheckCheck size={16} /> Marcar todas como leídas
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center text-gray-400 dark:text-gray-500">
          <Bell size={40} className="mx-auto mb-3 opacity-40" />
          <p>No tienes notificaciones todavía</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors ${!n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              onClick={() => !n.isRead && markRead.mutate(n.id)}
            >
              <div className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-indigo-500' : 'bg-transparent'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.isRead ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {n.message}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                </p>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 capitalize">{n.type.toLowerCase().replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
