import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { Session } from '@supabase/supabase-js';
import { Pool } from 'pg';
import type { AppSupabaseClient } from '../database';
import { PG_POOL, SUPABASE_CLIENT } from '../database';
import { mapAuthError } from './auth-error.mapper';
import { DEFAULT_CONTAINERS } from './default-containers';
import type {
  AuthSessionDto,
  AuthUserDto,
  RegisterResponseDto,
} from './dto/auth-session.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: AppSupabaseClient,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  /**
   * RF-01: registra al usuario en Supabase Auth y crea sus contenedores por
   * defecto (CT-02).
   *
   * No puede ser una única transacción: el usuario vive en Supabase Auth y
   * los contenedores en nuestra base. Por eso primero se crea el usuario y
   * después los contenedores con un único INSERT (atómico e idempotente).
   * Si ese INSERT falla, el usuario queda creado sin contenedores: se
   * registra el error con su id y se responde 500.
   */
  async register({
    email,
    password,
  }: RegisterDto): Promise<RegisterResponseDto> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      throw mapAuthError(error, 'No se pudo registrar el usuario');
    }
    if (!data.user) {
      throw new InternalServerErrorException('No se pudo registrar el usuario');
    }

    // Con confirmación de email activa, Supabase no informa que el email ya
    // existe: devuelve un usuario ficticio sin identidades.
    if (data.user.identities?.length === 0) {
      throw new ConflictException('Ya existe una cuenta con ese email');
    }

    await this.createDefaultContainers(data.user.id);

    return {
      user: { id: data.user.id, email: data.user.email ?? null },
      session: data.session ? toSessionDto(data.session) : null,
      email_confirmation_required: data.session === null,
    };
  }

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

  private async createDefaultContainers(userId: string): Promise<void> {
    try {
      await this.pool.query(
        `INSERT INTO containers (user_id, name)
         SELECT $1, unnest($2::text[])
         ON CONFLICT DO NOTHING`,
        [userId, DEFAULT_CONTAINERS],
      );
    } catch (error) {
      this.logger.error(
        `Usuario ${userId} registrado sin contenedores por defecto: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        'La cuenta se creó, pero no se pudieron crear los contenedores iniciales',
      );
    }
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
