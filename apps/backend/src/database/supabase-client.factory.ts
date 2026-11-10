import { createClient } from '@supabase/supabase-js';

export interface SupabaseClientOptions {
  url: string;
  publishableKey: string;
}

/**
 * Crea el cliente de Supabase para uso exclusivo de identidad (módulo auth).
 * Los datos de la aplicación se acceden siempre por el pool `pg`.
 *
 * Configuración de servidor: el cliente es compartido por todas las
 * peticiones, así que no guarda ni renueva sesiones por su cuenta. Cada
 * operación recibe explícitamente el token del usuario
 * (p. ej. `auth.getUser(accessToken)`).
 */
export function createSupabaseClient({
  url,
  publishableKey,
}: SupabaseClientOptions) {
  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/** Tipo del cliente inyectado con el token SUPABASE_CLIENT. */
export type AppSupabaseClient = ReturnType<typeof createSupabaseClient>;
