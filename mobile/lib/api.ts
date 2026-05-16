import * as SecureStore from 'expo-secure-store';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';

async function getAccessToken() {
  return SecureStore.getItemAsync('accessToken');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Try refresh
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (refreshToken) {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        await SecureStore.setItemAsync('accessToken', data.accessToken);
        headers['Authorization'] = `Bearer ${data.accessToken}`;
        const retry = await fetch(`${API_URL}${path}`, { ...options, headers });
        if (!retry.ok) throw new Error(`HTTP ${retry.status}`);
        return retry.json();
      }
    }
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    throw new Error('UNAUTHORIZED');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
