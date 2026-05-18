import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Notification } from '../types';
import api from '../api/axios';
import { subscribeToUserNotifications, onClientConnect } from '../api/websocket';
import { useAuth } from './useAuth';

export const useNotifications = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch initial notifications from REST
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await api.get<Notification[]>('/notifications');
      if (mountedRef.current) {
        setNotifications(data);
      }
    } catch {
      // Silently fail — notifications are non-critical
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Subscribe to WebSocket notifications.
  // Uses onClientConnect() to defer the subscription until the STOMP connection
  // is ready — avoids the "no underlying STOMP connection" crash on page reload
  // where AuthContext sets user before wsConnect()'s onConnect has fired.
  // The handler also re-runs on each reconnect, so subscriptions survive network drops.
  useEffect(() => {
    if (!user) return;

    let unsubscribeStomp = () => {};

    const removeConnectHandler = onClientConnect(() => {
      // Unsubscribe any previous subscription (e.g. after a reconnect)
      unsubscribeStomp();
      unsubscribeStomp = subscribeToUserNotifications(user.id, (message) => {
        try {
          const notification = JSON.parse(message.body) as Notification;
          if (mountedRef.current) {
            setNotifications((prev) => [notification, ...prev]);
            toast(notification.message, { icon: '🔔', duration: 4000 });

            // Sync React Query caches so pages update without manual refresh
            qc.invalidateQueries({ queryKey: ['notifications'] });
            if (notification.type === 'GRADE_PUBLISHED') {
              qc.invalidateQueries({ queryKey: ['exercises'] }); // updates mySubmissionStatus on CourseDetailPage
              qc.invalidateQueries({ queryKey: ['my-results'] });
            } else if (notification.type === 'NEW_EXERCISE') {
              qc.invalidateQueries({ queryKey: ['exercises'] });
              qc.invalidateQueries({ queryKey: ['courses'] });
            }
          }
        } catch {
          // malformed WS message — ignore
        }
      });
    });

    return () => {
      removeConnectHandler();
      unsubscribeStomp();
    };
  }, [user, qc]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      toast.error('Failed to mark all notifications as read');
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};

export default useNotifications;
