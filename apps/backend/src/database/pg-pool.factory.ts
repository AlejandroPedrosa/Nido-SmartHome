import { Logger } from '@nestjs/common';
import { Pool, PoolConfig, types } from 'pg';

/** OID de PostgreSQL para NUMERIC / DECIMAL. */
const NUMERIC_OID = 1700;

/**
 * Parsers de tipos propios del pool (no modifican el estado global de `pg`).
 * Por defecto `pg` devuelve NUMERIC como string para no perder precisión;
 * las cantidades del dominio son DECIMAL(10, 2), que un number representa
 * sin problemas, así que se convierten a number.
 */
const typeParsers: PoolConfig['types'] = {
  getTypeParser: ((oid: number, format?: 'text' | 'binary') => {
    if (oid === NUMERIC_OID && format !== 'binary') {
      return (value: string) => parseFloat(value);
    }
    return types.getTypeParser(oid, format) as (value: string) => unknown;
  }) as typeof types.getTypeParser,
};

export interface PgPoolOptions {
  connectionString: string;
  /** Certificado raíz (PEM) de la CA de Supabase para verificar el servidor. */
  sslCa?: string;
  max?: number;
}

export function buildPoolConfig({
  connectionString,
  sslCa,
  max = 10,
}: PgPoolOptions): PoolConfig {
  return {
    connectionString,
    max,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // SSL con verificación del certificado del servidor. Si se provee la CA de
    // Supabase se valida contra ella; si no, contra el almacén de CAs de Node.
    ssl: sslCa ? { ca: sslCa, rejectUnauthorized: true } : true,
    types: typeParsers,
  };
}

export function createPgPool(options: PgPoolOptions): Pool {
  const pool = new Pool(buildPoolConfig(options));
  const logger = new Logger('PgPool');

  // Un error en un cliente inactivo (p. ej. corte de red) emite 'error' en el
  // pool; sin este handler, Node terminaría el proceso.
  pool.on('error', (error) => {
    logger.error(`Error en un cliente inactivo del pool: ${error.message}`);
  });

  return pool;
}
