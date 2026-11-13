/** Token de inyección del pool de PostgreSQL: `@Inject(PG_POOL) pool: Pool`. */
export const PG_POOL = Symbol('PG_POOL');

/**
 * Token de inyección del cliente de Supabase (solo identidad / auth):
 * `@Inject(SUPABASE_CLIENT) supabase: AppSupabaseClient`.
 */
export const SUPABASE_CLIENT = Symbol('SUPABASE_CLIENT');
