import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthApiError } from '@supabase/supabase-js';
import { Pool } from 'pg';
import type { AppSupabaseClient } from '../database';
import { AuthService } from './auth.service';
import { DEFAULT_CONTAINERS } from './default-containers';

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
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    refreshSession: jest.fn(),
    admin: { signOut: jest.fn() },
  };
  const pool = { query: jest.fn() };
  const service = new AuthService(
    { auth } as unknown as AppSupabaseClient,
    pool as unknown as Pool,
    'http://localhost:5173',
  );

  beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockResolvedValue({ rows: [], rowCount: 6 });
  });

  describe('register', () => {
    const credentials = { email: 'ana@test.com', password: 'secreta123' };
    const newUser = {
      id: 'user-1',
      email: 'ana@test.com',
      identities: [{ id: 'identity-1' }],
    };

    it('crea el usuario, sus contenedores por defecto y devuelve la sesión', async () => {
      auth.signUp.mockResolvedValue({
        data: { user: newUser, session },
        error: null,
      });

      const result = await service.register(credentials);

      // El link de confirmación lleva al login del frontend, no a la Site URL.
      expect(auth.signUp).toHaveBeenCalledWith({
        ...credentials,
        options: { emailRedirectTo: 'http://localhost:5173/login' },
      });
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO containers'),
        ['user-1', DEFAULT_CONTAINERS],
      );
      expect(result).toEqual({
        user: { id: 'user-1', email: 'ana@test.com' },
        session: expect.objectContaining({ access_token: 'access-jwt' }),
        email_confirmation_required: false,
      });
    });

    it('crea los 6 contenedores de la regla CT-02', () => {
      expect(DEFAULT_CONTAINERS).toEqual([
        'Cocina',
        'Heladera',
        'Freezer',
        'Alacena',
        'Baño',
        'Lavadero',
      ]);
    });

    it('sin sesión si el proyecto exige confirmar el email', async () => {
      auth.signUp.mockResolvedValue({
        data: { user: newUser, session: null },
        error: null,
      });

      const result = await service.register(credentials);

      expect(result.session).toBeNull();
      expect(result.email_confirmation_required).toBe(true);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('responde 409 si el email ya existe (confirmación activa: sin identidades)', async () => {
      auth.signUp.mockResolvedValue({
        data: { user: { ...newUser, identities: [] }, session: null },
        error: null,
      });

      await expect(service.register(credentials)).rejects.toThrow(
        ConflictException,
      );
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('responde 409 si Supabase informa que el usuario ya existe', async () => {
      auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: authError('user_already_exists', 422),
      });

      await expect(service.register(credentials)).rejects.toThrow(
        new ConflictException('Ya existe una cuenta con ese email'),
      );
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('responde 400 si la contraseña es débil para Supabase', async () => {
      auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: authError('weak_password', 422),
      });

      await expect(service.register(credentials)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('responde 500 y registra el id si fallan los contenedores', async () => {
      const logSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      auth.signUp.mockResolvedValue({
        data: { user: newUser, session },
        error: null,
      });
      pool.query.mockRejectedValue(new Error('connection lost'));

      await expect(service.register(credentials)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('user-1'));
    });
  });

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
