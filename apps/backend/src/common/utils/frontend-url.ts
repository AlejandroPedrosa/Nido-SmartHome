import { parseCorsOrigins } from './parse-cors-origins';

/**
 * URL base del frontend, sin barra final. Se usa para los links que Supabase
 * envía por email (confirmación de cuenta).
 *
 * Usa `FRONTEND_URL` si está definida; si no, el primer origen de
 * `CORS_ORIGIN` (que ya es la URL del frontend). Así cada entorno (local,
 * EC2) redirige a su propio frontend aunque compartan el proyecto de
 * Supabase.
 *
 * @example resolveFrontendUrl(undefined, 'http://localhost:5173, https://nido.vercel.app')
 * // 'http://localhost:5173'
 */
export function resolveFrontendUrl(
  frontendUrl: string | undefined,
  corsOrigin: string,
): string {
  const explicit = frontendUrl?.trim().replace(/\/+$/, '');
  if (explicit) {
    return explicit;
  }
  const [first] = parseCorsOrigins(corsOrigin);
  if (!first) {
    throw new Error('No se pudo determinar la URL del frontend');
  }
  return first;
}
