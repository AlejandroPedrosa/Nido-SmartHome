import type { AuthSession, AuthUser } from '@/types';

const STORAGE_KEY = 'nido-auth-session';

export interface PersistedAuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number | null;
}

/** Lectura/escritura de la sesión fuera de React (interceptores de axios). */

export function getAuthSession(): PersistedAuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedAuthSession;
  } catch {
    return null;
  }
}

export function setAuthSession(session: AuthSession): void {
  const value: PersistedAuthSession = {
    user: session.user,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function clearAuthSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAccessToken(): string | null {
  return getAuthSession()?.access_token ?? null;
}

export function getRefreshToken(): string | null {
  return getAuthSession()?.refresh_token ?? null;
}

/** Misma clave que usa el persist de Zustand (`useAuthStore`). */
export const AUTH_STORAGE_KEY = STORAGE_KEY;
