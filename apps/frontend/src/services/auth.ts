import { apiGet, apiPost } from '@/lib/api';
import type { AuthSession, AuthUser, RegisterResponse } from '@/types';

export const authService = {
  login(email: string, password: string): Promise<AuthSession> {
    return apiPost<AuthSession>('/auth/login', { email, password });
  },

  register(email: string, password: string): Promise<RegisterResponse> {
    return apiPost<RegisterResponse>('/auth/register', { email, password });
  },

  refresh(refresh_token: string): Promise<AuthSession> {
    return apiPost<AuthSession>('/auth/refresh', { refresh_token });
  },

  /** POST /auth/logout → 204 No Content */
  async logout(): Promise<void> {
    await apiPost<void>('/auth/logout');
  },

  me(): Promise<AuthUser> {
    return apiGet<AuthUser>('/auth/me');
  },
};
