import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_URL } from './api';

const WS_URL = API_URL.replace('/api', '/ws');

export type NotificationPayload = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string;
  createdAt: string;
};

type NotificationHandler = (notification: NotificationPayload) => void;
type TokenGetter = () => Promise<string | null>;

let stompClient: Client | null = null;
let _getWsToken: TokenGetter | null = null;

/** Wire in the Clerk getToken function (called from ClerkTokenBridge in _layout.tsx). */
export const setWsTokenGetter = (fn: TokenGetter) => {
  _getWsToken = fn;
};

export function connectWS(userId: string, onNotification: NotificationHandler): void {
  if (stompClient?.active) {
    stompClient.deactivate();
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
    // Token is fetched fresh before every connect / reconnect attempt
    beforeConnect: async () => {
      const token = _getWsToken ? await _getWsToken() : null;
      stompClient!.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    },
    reconnectDelay: 8000,
    onConnect: () => {
      stompClient!.subscribe(
        `/topic/user/${userId}/notifications`,
        (message) => {
          try {
            const notification = JSON.parse(message.body) as NotificationPayload;
            onNotification(notification);
          } catch {
            // malformed message — ignore
          }
        }
      );
    },
    onStompError: () => {
      // silent — real-time degrades gracefully, pull-to-refresh still works
    },
  });

  stompClient.activate();
}

export function disconnectWS(): void {
  if (stompClient?.active) {
    stompClient.deactivate();
  }
  stompClient = null;
}
