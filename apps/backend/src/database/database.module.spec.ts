import { Pool } from 'pg';
import { DatabaseModule } from './database.module';

describe('DatabaseModule', () => {
  const pool = {
    query: jest.fn(),
    end: jest.fn(),
  };
  let module: DatabaseModule;

  beforeEach(() => {
    jest.clearAllMocks();
    module = new DatabaseModule(pool as unknown as Pool);
  });

  it('verifica la conexión al iniciar la aplicación', async () => {
    pool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

    await module.onApplicationBootstrap();

    expect(pool.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('propaga el error si la base no responde (fail fast)', async () => {
    pool.query.mockRejectedValue(new Error('connection refused'));

    await expect(module.onApplicationBootstrap()).rejects.toThrow(
      'connection refused',
    );
  });

  it('cierra el pool al apagar la aplicación', async () => {
    pool.end.mockResolvedValue(undefined);

    await module.onApplicationShutdown();

    expect(pool.end).toHaveBeenCalledTimes(1);
  });
});
