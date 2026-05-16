import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient: Client | null = null;

export const connect = (token: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    stompClient = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
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
};

export const subscribeToUserNotifications = (
  userId: string,
  callback: (message: IMessage) => void
): (() => void) => {
  if (!stompClient || !stompClient.active) {
    console.warn('STOMP client not connected');
    return () => {};
  }

  const subscription = stompClient.subscribe(
    `/topic/user/${userId}/notifications`,
    callback
  );

  return () => subscription.unsubscribe();
};

export const getClient = (): Client | null => stompClient;
