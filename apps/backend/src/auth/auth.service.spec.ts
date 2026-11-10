import {
  HttpStatus,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthApiError } from '@supabase/supabase-js';
import type { AppSupabaseClient } from '../database';
import { AuthService } from './auth.service';

const session = {
  access_token: 'access-jwt',
  refresh_token: 'refresh-123',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 1_800_000_000,
  user: { id: 'user-1', email: 'ana@test.com' },
};

const authError = (code: string, status = 400) =>
  new AuthApiError('mensaje interno de supabase', status, code);

describe('AuthService', () => {
  const auth = {
    signInWithPassword: jest.fn(),
    refreshSession: jest.fn(),
    admin: { signOut: jest.fn() },
  };
  const service = new AuthService({ auth } as unknown as AppSupabaseClient);

  beforeEach(() => jest.clearAllMocks());

  describe('login', () => {
    const credentials = { email: 'ana@test.com', password: 'secreta123' };

    it('devuelve la sesión con tokens y usuario', async () => {
      auth.signInWithPassword.mockResolvedValue({
        data: { session, user: session.user },
        error: null,
      });

      await expect(service.login(credentials)).resolves.toEqual({
        access_token: 'access-jwt',
        refresh_token: 'refresh-123',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: 1_800_000_000,
        user: { id: 'user-1', email: 'ana@test.com' },
      });
      expect(auth.signInWithPassword).toHaveBeenCalledWith(credentials);
    });

    it('responde 401 con credenciales inválidas', async () => {
      auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: authError('invalid_credentials'),
      });

      await expect(service.login(credentials)).rejects.toThrow(
        new UnauthorizedException('Email o contraseña incorrectos'),
      );
    });
  });

  describe('refresh', () => {
    it('devuelve una sesión nueva', async () => {
      auth.refreshSession.mockResolvedValue({
        data: { session, user: session.user },
        error: null,
      });

      const result = await service.refresh('refresh-123');

      expect(result.access_token).toBe('access-jwt');
      expect(auth.refreshSession).toHaveBeenCalledWith({
        refresh_token: 'refresh-123',
      });
    });

    it('responde 401 si el refresh token ya fue usado', async () => {
      auth.refreshSession.mockResolvedValue({
        data: { session: null, user: null },
        error: authError('refresh_token_already_used'),
      });

      await expect(service.refresh('viejo')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('responde 401 si Supabase no devuelve sesión', async () => {
      auth.refreshSession.mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      });

      await expect(service.refresh('x')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('cierra solo la sesión actual usando el JWT explícito', async () => {
      auth.admin.signOut.mockResolvedValue({ data: null, error: null });

      await expect(service.logout('access-jwt')).resolves.toBeUndefined();
      expect(auth.admin.signOut).toHaveBeenCalledWith('access-jwt', 'local');
    });

    it('responde 503 si Supabase falla', async () => {
      auth.admin.signOut.mockResolvedValue({
        data: null,
        error: authError('unexpected_failure', 500),
      });

      await expect(service.logout('access-jwt')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  it('me devuelve id y email sin exponer el token', () => {
    expect(
      service.me({ id: 'user-1', email: 'ana@test.com', accessToken: 'jwt' }),
    ).toEqual({ id: 'user-1', email: 'ana@test.com' });
  });

  it('el estado 429 de Supabase se propaga como 429', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: authError('over_request_rate_limit', 429),
    });

    await expect(
      service.login({ email: 'a@b.com', password: 'x' }),
    ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
  });
});
