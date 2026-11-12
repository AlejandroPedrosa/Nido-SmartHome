import { create } from 'zustand';
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  type PersistedAuthSession,
} from '@/lib/auth-session';
import { ApiError } from '@/lib/api';
import { authService } from '@/services/auth';
import type { AuthSession, AuthUser, RegisterResponse } from '@/types';

interface AuthState {
  user: AuthUser | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
  isHydrated: boolean;
  hydrate: () => void;
  applySession: (session: AuthSession) => void;
  clearSession: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthSession>;
  fetchMe: () => Promise<AuthUser>;
  isAuthenticated: () => boolean;
}

function fromPersisted(session: PersistedAuthSession | null) {
  return {
    user: session?.user ?? null,
    access_token: session?.access_token ?? null,
    refresh_token: session?.refresh_token ?? null,
    expires_at: session?.expires_at ?? null,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...fromPersisted(null),
  isHydrated: false,

  hydrate: () => {
    set({ ...fromPersisted(getAuthSession()), isHydrated: true });
  },

  applySession: (session) => {
    setAuthSession(session);
    set({
      user: session.user,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
    });
  },

  clearSession: () => {
    clearAuthSession();
    set({
      user: null,
      access_token: null,
      refresh_token: null,
      expires_at: null,
    });
  },

  isAuthenticated: () => Boolean(get().access_token && get().user),

  login: async (email, password) => {
    const session = await authService.login(email, password);
    get().applySession(session);
  },

  register: async (email, password) => {
    const response = await authService.register(email, password);
    if (response.session) {
      get().applySession(response.session);
    }
    return response;
  },

  logout: async () => {
    try {
      if (get().access_token) {
        await authService.logout();
      }
    } catch (error) {
      // Si el token ya expiró, igual limpiamos la sesión local.
      if (!(error instanceof ApiError && error.statusCode === 401)) {
        throw error;
      }
    } finally {
      get().clearSession();
    }
  },

  refresh: async () => {
    const token = get().refresh_token ?? getAuthSession()?.refresh_token;
    if (!token) {
      get().clearSession();
      throw new ApiError({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Sesión expirada',
      });
    }
    const session = await authService.refresh(token);
    get().applySession(session);
    return session;
  },

  fetchMe: async () => {
    const user = await authService.me();
    set({ user });
    const current = getAuthSession();
    if (current) {
      setAuthSession({
        access_token: current.access_token,
        refresh_token: current.refresh_token,
        token_type: 'bearer',
        expires_in: 0,
        expires_at: current.expires_at,
        user,
      });
    }
    return user;
  },
}));
