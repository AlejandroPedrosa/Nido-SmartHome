import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Session } from '@supabase/supabase-js';
import type { AppSupabaseClient } from '../database';
import { SUPABASE_CLIENT } from '../database';
import { mapAuthError } from './auth-error.mapper';
import type { AuthSessionDto, AuthUserDto } from './dto/auth-session.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';

/**
 * Operaciones de identidad contra Supabase Auth.
 *
 * El cliente de Supabase es compartido por todas las peticiones: cada
 * operación recibe explícitamente las credenciales o tokens del usuario y
 * nunca se depende de una sesión guardada en el cliente.
 */
@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: AppSupabaseClient,
  ) {}

  async login({ email, password }: LoginDto): Promise<AuthSessionDto> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw mapAuthError(error, 'Email o contraseña incorrectos');
    }
    return toSessionDto(data.session);
  }

  async refresh(refreshToken: string): Promise<AuthSessionDto> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error) {
      throw mapAuthError(error, 'La sesión expiró. Iniciá sesión nuevamente');
    }
    if (!data.session) {
      throw new UnauthorizedException(
        'La sesión expiró. Iniciá sesión nuevamente',
      );
    }
    return toSessionDto(data.session);
  }

  /**
   * Cierra la sesión actual del usuario (scope `local`): revoca su refresh
   * token y el access token deja de pasar el guard. Se usa `admin.signOut`
   * porque recibe el JWT explícito; solo requiere la Publishable key.
   */
  async logout(accessToken: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.signOut(
      accessToken,
      'local',
    );
    if (error) {
      throw mapAuthError(error, 'No se pudo cerrar la sesión');
    }
  }

  me(user: AuthenticatedUser): AuthUserDto {
    return { id: user.id, email: user.email };
  }
}

export function toSessionDto(session: Session): AuthSessionDto {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: session.token_type,
    expires_in: session.expires_in,
    expires_at: session.expires_at ?? null,
    user: { id: session.user.id, email: session.user.email ?? null },
  };
}
