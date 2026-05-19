export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';

// ── Clerk token getter (wired in _layout.tsx via ClerkTokenBridge) ────────────
type ClerkGetToken = (opts?: { skipCache?: boolean; template?: string }) => Promise<string | null>;
let _getToken: ClerkGetToken | null = null;

export const setClerkTokenGetter = (fn: ClerkGetToken) => {
  _getToken = fn;
};

/** Returns the current Clerk JWT (or null if not signed in). */
export async function getApiToken(): Promise<string | null> {
  return _getToken ? _getToken() : null;
}
// ─────────────────────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = _getToken ? await _getToken() : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && _getToken) {
    // Force Clerk to bypass its internal cache and get a fresh token
    const fresh = await _getToken({ skipCache: true });
    if (fresh) {
      headers['Authorization'] = `Bearer ${fresh}`;
      const retry = await fetch(`${API_URL}${path}`, { ...options, headers });
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? `HTTP ${retry.status}`);
      }
      if (retry.status === 204) return undefined as T;
      return retry.json();
    }
    throw new Error('UNAUTHORIZED');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
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
