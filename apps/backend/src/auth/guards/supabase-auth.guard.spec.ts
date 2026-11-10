import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AppSupabaseClient } from '../../database';
import { AuthenticatedRequest } from '../interfaces/authenticated-user.interface';
import { SupabaseAuthGuard } from './supabase-auth.guard';

describe('SupabaseAuthGuard', () => {
  const getUser = jest.fn();
  const supabase = { auth: { getUser } } as unknown as AppSupabaseClient;
  const guard = new SupabaseAuthGuard(supabase);

  const contextWith = (
    authorization?: string,
  ): { context: ExecutionContext; request: Partial<AuthenticatedRequest> } => {
    const request = {
      headers: authorization ? { authorization } : {},
    } as Partial<AuthenticatedRequest>;
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { context, request };
  };

  beforeEach(() => jest.clearAllMocks());

  it('adjunta el usuario al request con un token válido', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'ana@test.com' } },
      error: null,
    });
    const { context, request } = contextWith('Bearer token-valido');

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(getUser).toHaveBeenCalledWith('token-valido');
    expect(request.user).toEqual({
      id: 'user-1',
      email: 'ana@test.com',
      accessToken: 'token-valido',
    });
  });

  it('usa email null si el usuario no tiene email', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'user-2' } },
      error: null,
    });
    const { context, request } = contextWith('Bearer t');

    await guard.canActivate(context);

    expect(request.user?.email).toBeNull();
  });

  it.each([
    ['sin header', undefined],
    ['header vacío', ''],
    ['sin prefijo Bearer', 'token-sin-prefijo'],
    ['otro esquema', 'Basic dXNlcjpwYXNz'],
    ['Bearer sin token', 'Bearer    '],
  ])('responde 401 sin consultar a Supabase: %s', async (_case, header) => {
    const { context } = contextWith(header);

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Token de acceso ausente'),
    );
    expect(getUser).not.toHaveBeenCalled();
  });

  it('responde 401 si Supabase rechaza el token (inválido o expirado)', async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'token is expired', status: 403 },
    });
    const { context } = contextWith('Bearer token-expirado');

    await expect(guard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Token inválido o expirado'),
    );
  });
});
