import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../hooks/useNotifications';
import clsx from 'clsx';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recent = notifications.slice(0, 5);

  const handleNotificationClick = async (id: string, relatedEntityId?: string) => {
    await markAsRead(id);
    setIsOpen(false);
    if (relatedEntityId) {
      navigate(`/notifications`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{unreadCount} unread</span>
            )}
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-72 overflow-y-auto">
            {recent.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                No notifications yet
              </div>
            ) : (
              recent.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.relatedEntityId)}
                  className={clsx(
                    'w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                    !n.isRead && 'bg-indigo-50/50 dark:bg-indigo-900/20'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
                    )}
                    <div className={clsx(!n.isRead ? '' : 'ml-4')}>
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug">{n.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => { navigate('/notifications'); setIsOpen(false); }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium w-full text-center py-1"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
