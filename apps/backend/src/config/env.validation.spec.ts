import { NodeEnv, validateEnv } from './env.validation';

describe('validateEnv', () => {
  const validEnv = {
    NODE_ENV: 'production',
    PORT: '8080',
    DATABASE_URL:
      'postgresql://postgres.ref:secret@aws-0-sa-east-1.pooler.supabase.com:5432/postgres',
    SUPABASE_URL: 'https://ref.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test123',
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

  it.each([
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY',
    'CORS_ORIGIN',
  ])('falla si falta %s', (key) => {
    const env: Record<string, unknown> = { ...validEnv };
    delete env[key];

    expect(() => validateEnv(env)).toThrow(key);
  });

  it('rechaza una DATABASE_URL que no sea postgresql', () => {
    expect(() =>
      validateEnv({ ...validEnv, DATABASE_URL: 'mysql://user@host/db' }),
    ).toThrow('DATABASE_URL');
  });

  it('rechaza una SUPABASE_URL con rutas', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        SUPABASE_URL: 'https://ref.supabase.co/rest/v1/',
      }),
    ).toThrow('SUPABASE_URL');
  });

  it('acepta una SUPABASE_URL con barra final', () => {
    const env = validateEnv({
      ...validEnv,
      SUPABASE_URL: 'https://ref.supabase.co/',
    });

    expect(env.SUPABASE_URL).toBe('https://ref.supabase.co/');
  });

  it('rechaza una Secret key en lugar de la Publishable key', () => {
    expect(() =>
      validateEnv({
        ...validEnv,
        SUPABASE_PUBLISHABLE_KEY: 'sb_secret_abc123',
      }),
    ).toThrow('SUPABASE_PUBLISHABLE_KEY');
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
