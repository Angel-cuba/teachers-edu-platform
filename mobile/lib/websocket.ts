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

let stompClient: Client | null = null;

export function connectWS(token: string, userId: string, onNotification: NotificationHandler): void {
  if (stompClient?.active) {
    stompClient.deactivate();
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
    connectHeaders: { Authorization: `Bearer ${token}` },
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
