import { useEffect, useRef } from 'react';
import { IMessage } from '@stomp/stompjs';
import { onClientConnect, getClient } from '../api/websocket';
import { useAuth } from './useAuth';

/**
 * Generic hook to subscribe to an arbitrary STOMP topic.
 * Uses onClientConnect() so the subscription is deferred until the
 * connection is ready — safe to call on page reload or before wsConnect resolves.
 */
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

    let unsubscribeStomp = () => {};

    const removeHandler = onClientConnect(() => {
      const client = getClient();
      if (!client?.connected) return;

      // Unsubscribe previous subscription (in case of reconnect)
      unsubscribeStomp();
      const sub = client.subscribe(topic, (msg) => {
        onMessageRef.current(msg);
      });
      unsubscribeStomp = () => sub.unsubscribe();
    });

    return () => {
      removeHandler();
      unsubscribeStomp();
    };
  }, [topic, enabled, user]);
};

export default useWebSocket;
