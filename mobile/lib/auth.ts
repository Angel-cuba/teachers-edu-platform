import * as SecureStore from 'expo-secure-store';
import { api, API_URL } from './api';
import type { AuthResponse, User } from './types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Credenciales incorrectas');
  }
  const data: AuthResponse = await res.json();
  await SecureStore.setItemAsync('accessToken', data.accessToken);
  await SecureStore.setItemAsync('refreshToken', data.refreshToken);
  await SecureStore.setItemAsync('user', JSON.stringify(data.user));
  return data;
}

export async function register(displayName: string, email: string, password: string, role: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, email, password, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Error al registrar');
  }
  const data: AuthResponse = await res.json();
  await SecureStore.setItemAsync('accessToken', data.accessToken);
  await SecureStore.setItemAsync('refreshToken', data.refreshToken);
  await SecureStore.setItemAsync('user', JSON.stringify(data.user));
  return data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {}
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
  await SecureStore.deleteItemAsync('user');
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync('user');
  return raw ? JSON.parse(raw) : null;
}
