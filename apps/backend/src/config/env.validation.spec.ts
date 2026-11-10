import { NodeEnv, validateEnv } from './env.validation';

describe('validateEnv', () => {
  const validEnv = {
    NODE_ENV: 'production',
    PORT: '8080',
    DATABASE_URL:
      'postgresql://postgres.ref:secret@aws-0-sa-east-1.pooler.supabase.com:5432/postgres',
    SUPABASE_URL: 'https://ref.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
    CORS_ORIGIN: 'http://localhost:5173',
  };

  it('acepta una configuración válida y convierte PORT a número', () => {
    const env = validateEnv(validEnv);

    expect(env.PORT).toBe(8080);
    expect(env.NODE_ENV).toBe(NodeEnv.Production);
    expect(env.DATABASE_URL).toBe(validEnv.DATABASE_URL);
  });

  it('aplica valores por defecto para NODE_ENV y PORT', () => {
    const { NODE_ENV: _nodeEnv, PORT: _port, ...rest } = validEnv;

    const env = validateEnv(rest);

    expect(env.NODE_ENV).toBe(NodeEnv.Development);
    expect(env.PORT).toBe(3000);
  });

  it.each(['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'CORS_ORIGIN'])(
    'falla si falta %s',
    (key) => {
      const env: Record<string, unknown> = { ...validEnv };
      delete env[key];

      expect(() => validateEnv(env)).toThrow(key);
    },
  );

  it('rechaza una DATABASE_URL que no sea postgresql', () => {
    expect(() =>
      validateEnv({ ...validEnv, DATABASE_URL: 'mysql://user@host/db' }),
    ).toThrow('DATABASE_URL');
  });

  it('rechaza un PORT fuera de rango', () => {
    expect(() => validateEnv({ ...validEnv, PORT: '70000' })).toThrow('PORT');
  });

  it('rechaza un NODE_ENV desconocido', () => {
    expect(() => validateEnv({ ...validEnv, NODE_ENV: 'staging' })).toThrow(
      'NODE_ENV',
    );
  });
});
