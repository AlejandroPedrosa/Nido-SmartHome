import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { AppSupabaseClient } from '../../database';
import { SUPABASE_CLIENT } from '../../database';
import { AuthenticatedRequest } from '../interfaces/authenticated-user.interface';

const BEARER_PREFIX = 'Bearer ';

/**
 * Protege rutas privadas validando el JWT de Supabase (RNF-01).
 *
 * Lee `Authorization: Bearer <token>`, lo valida contra Supabase Auth con
 * `auth.getUser(token)` y adjunta el usuario a `request.user`. Validar contra
 * el servidor (y no solo la firma local) permite detectar sesiones cerradas
 * con logout. Ante token ausente, inválido o expirado responde 401.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: AppSupabaseClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Token de acceso ausente');
    }

    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      this.logger.debug(`Token rechazado: ${error?.message ?? 'sin usuario'}`);
      throw new UnauthorizedException('Token inválido o expirado');
    }

    request.user = {
      id: data.user.id,
      email: data.user.email ?? null,
      accessToken: token,
    };
    return true;
  }

  private extractToken(header: string | undefined): string | null {
    if (!header?.startsWith(BEARER_PREFIX)) {
      return null;
    }
    const token = header.slice(BEARER_PREFIX.length).trim();
    return token.length > 0 ? token : null;
  }
}
