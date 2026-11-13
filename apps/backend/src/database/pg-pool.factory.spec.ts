import { Pool } from 'pg';
import { buildPoolConfig, createPgPool } from './pg-pool.factory';

const NUMERIC_OID = 1700;
const INT4_OID = 23;
const connectionString = 'postgresql://user:pass@localhost:5432/db';

describe('buildPoolConfig', () => {
  it('usa la connection string y valores por defecto del pool', () => {
    const config = buildPoolConfig({ connectionString });

    expect(config.connectionString).toBe(connectionString);
    expect(config.max).toBe(10);
    expect(config.connectionTimeoutMillis).toBe(10_000);
  });

  it('exige SSL verificado contra las CAs de Node si no hay CA propia', () => {
    expect(buildPoolConfig({ connectionString }).ssl).toBe(true);
  });

  it('verifica el certificado contra la CA provista', () => {
    const config = buildPoolConfig({ connectionString, sslCa: 'PEM' });

    expect(config.ssl).toEqual({ ca: 'PEM', rejectUnauthorized: true });
  });

  it('convierte NUMERIC a number y respeta los demás tipos', () => {
    const { types } = buildPoolConfig({ connectionString });
    const parseNumeric = types!.getTypeParser(NUMERIC_OID, 'text') as (
      value: string,
    ) => unknown;
    const parseInt4 = types!.getTypeParser(INT4_OID, 'text') as (
      value: string,
    ) => unknown;

    expect(parseNumeric('750.50')).toBe(750.5);
    expect(parseInt4('42')).toBe(42);
  });
});

describe('createPgPool', () => {
  it('crea un Pool con un handler de errores para clientes inactivos', async () => {
    const pool = createPgPool({ connectionString });

    expect(pool).toBeInstanceOf(Pool);
    expect(pool.listenerCount('error')).toBe(1);
    expect(() =>
      pool.emit('error', new Error('conexión perdida')),
    ).not.toThrow();

    await pool.end();
  });
});
