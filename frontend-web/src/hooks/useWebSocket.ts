import { useEffect, useRef } from 'react';
import { IMessage } from '@stomp/stompjs';
import { subscribeToUserNotifications, getClient } from '../api/websocket';
import { useAuth } from './useAuth';

export const useWebSocket = (
  topic: string,
  onMessage: (message: IMessage) => void,
  enabled = true
) => {
  const { user } = useAuth();
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled || !user) return;

    const client = getClient();
    if (!client || !client.active) return;

    const subscription = client.subscribe(topic, (msg) => {
      onMessageRef.current(msg);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [topic, enabled, user]);
};

export const useUserNotificationsSocket = (
  onMessage: (message: IMessage) => void
) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserNotifications(user.id, (msg) => {
      onMessage(msg);
    });

    return unsubscribe;
  }, [user, onMessage]);
};

export default useWebSocket;
