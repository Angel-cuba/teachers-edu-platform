import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Clerk token injection ─────────────────────────────────────────────────────
// AuthContext calls setClerkTokenGetter() on mount so the interceptor can
// fetch a fresh Clerk JWT without importing React hooks here.
let _getToken: (() => Promise<string | null>) | null = null;

export const setClerkTokenGetter = (fn: () => Promise<string | null>) => {
  _getToken = fn;
};
// ─────────────────────────────────────────────────────────────────────────────

// Request interceptor — attach Clerk JWT
api.interceptors.request.use(
  async (config) => {
    if (_getToken) {
      const token = await _getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — on 401, force a fresh token and retry once.
// Clerk handles token refresh automatically inside getToken().
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && _getToken) {
      originalRequest._retry = true;

      try {
        // Force Clerk to issue a fresh token (skips its internal cache)
        const token = await _getToken();
        if (token) {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch {
        // Token refresh failed — fall through to redirect
      }

      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default api;
