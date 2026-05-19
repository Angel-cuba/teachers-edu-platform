import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient: Client | null = null;

// Handlers registered via onClientConnect() — fired on every onConnect (initial + reconnects)
const connectHandlers = new Set<() => void>();

// Token getter set by AuthContext — called before each connection attempt
// so reconnects always use a fresh Clerk JWT, never a stale one.
type TokenGetter = () => Promise<string | null>;
let _getWsToken: TokenGetter | null = null;

export const setWsTokenGetter = (fn: TokenGetter) => {
  _getWsToken = fn;
};

export const connect = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    stompClient = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      // beforeConnect is called before the initial connect AND every reconnect.
      // Fetching the token here ensures reconnects always use a fresh Clerk JWT.
      beforeConnect: async () => {
        const token = _getWsToken ? await _getWsToken() : null;
        stompClient!.connectHeaders = token
          ? { Authorization: `Bearer ${token}` }
          : {};
      },
      reconnectDelay: 5000,
      onConnect: () => {
        // Fire all deferred subscriptions (initial connect and each reconnect)
        connectHandlers.forEach((h) => h());
        resolve();
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
        reject(new Error(frame.headers['message'] || 'STOMP connection error'));
      },
    });

    stompClient.activate();
  });
};

export const disconnect = (): void => {
  if (stompClient && stompClient.active) {
    stompClient.deactivate();
    stompClient = null;
  }
  connectHandlers.clear();
};

export const subscribeToUserNotifications = (
  userId: string,
  callback: (message: IMessage) => void
): (() => void) => {
  // Use .connected (true only after onConnect) — not .active (true from activate())
  if (!stompClient || !stompClient.connected) {
    console.warn('STOMP client not connected');
    return () => {};
  }

  const subscription = stompClient.subscribe(
    `/topic/user/${userId}/notifications`,
    callback
  );

  return () => subscription.unsubscribe();
};

/**
 * Register a handler to run as soon as the STOMP connection is ready.
 * - If already connected: fires immediately.
 * - If connecting/reconnecting: deferred until onConnect fires.
 * - Fires again on each reconnect so subscriptions survive network drops.
 *
 * Returns a cleanup function that removes the handler from the registry.
 */
export const onClientConnect = (handler: () => void): (() => void) => {
  if (stompClient?.connected) {
    handler();
    return () => {};
  }
  connectHandlers.add(handler);
  return () => connectHandlers.delete(handler);
};

export const getClient = (): Client | null => stompClient;
