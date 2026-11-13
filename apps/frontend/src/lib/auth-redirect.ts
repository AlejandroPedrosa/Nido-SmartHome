/**
 * Resultado del link de confirmación de cuenta que envía Supabase.
 *
 * Supabase confirma el email en su servidor y redirige a `/login` agregando
 * el resultado en el fragmento de la URL:
 * - Éxito: `#access_token=...&type=signup` (los tokens no se usan: la sesión
 *   se obtiene con POST /auth/login).
 * - Error: `#error=...&error_code=otp_expired&error_description=...`
 *   (a veces también en el query string).
 */
export type AuthRedirectResult =
  | { kind: 'confirmed' }
  | { kind: 'error'; message: string };

const EXPIRED_MESSAGE =
  'El link de confirmación venció o ya fue usado. Si ya confirmaste tu cuenta, iniciá sesión; si no, registrate de nuevo.';
const GENERIC_ERROR_MESSAGE =
  'No se pudo confirmar la cuenta. Probá abrir de nuevo el link del correo o registrate otra vez.';

export function parseAuthRedirect(hash: string, search: string): AuthRedirectResult | null {
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  const query = new URLSearchParams(search);
  const get = (key: string) => fragment.get(key) ?? query.get(key);

  if (get('error') || get('error_code')) {
    return {
      kind: 'error',
      message: get('error_code') === 'otp_expired' ? EXPIRED_MESSAGE : GENERIC_ERROR_MESSAGE,
    };
  }
  if (get('type') === 'signup' || get('type') === 'email') {
    return { kind: 'confirmed' };
  }
  return null;
}

/**
 * Quita del URL el fragmento y los parámetros de Supabase (incluidos los
 * tokens) sin recargar ni agregar una entrada al historial.
 */
export function clearAuthRedirectFromUrl(): void {
  const url = new URL(window.location.href);
  for (const key of ['error', 'error_code', 'error_description', 'code', 'type']) {
    url.searchParams.delete(key);
  }
  url.hash = '';
  window.history.replaceState(window.history.state, '', url.pathname + url.search);
}
