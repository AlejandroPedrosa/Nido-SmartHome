import { Request } from 'express';

/**
 * Usuario autenticado, adjuntado al request por SupabaseAuthGuard.
 * `id` es el `auth.users.id` de Supabase: el `user_id` que filtra todas las
 * consultas (regla MT-02). Nunca se toma del body de la petición.
 */
export interface AuthenticatedUser {
  id: string;
  email: string | null;
  /** JWT original, necesario para operaciones como el logout. */
  accessToken: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
