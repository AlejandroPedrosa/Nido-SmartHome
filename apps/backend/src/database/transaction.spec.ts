import { Pool, PoolClient } from 'pg';
import { withTransaction } from './transaction';

describe('withTransaction', () => {
  let client: { query: jest.Mock; release: jest.Mock };
  let pool: { connect: jest.Mock };

  beforeEach(() => {
    client = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };
    pool = { connect: jest.fn().mockResolvedValue(client) };
  });

  const run = <T>(
    work: (c: PoolClient) => Promise<T>,
    existing?: PoolClient,
  ): Promise<T> => withTransaction(pool as unknown as Pool, work, existing);

  const executedSql = (): string[] =>
    client.query.mock.calls.map(([sql]) => sql as string);

  it('hace BEGIN, ejecuta el trabajo, COMMIT y devuelve el resultado', async () => {
    const result = await run(async (c) => {
      await c.query('UPDATE products SET current_stock = 1');
      return 'ok';
    });

    expect(result).toBe('ok');
    expect(executedSql()).toEqual([
      'BEGIN',
      'UPDATE products SET current_stock = 1',
      'COMMIT',
    ]);
    expect(client.release).toHaveBeenCalledWith(undefined);
  });

  it('hace ROLLBACK y relanza el error original si el trabajo falla', async () => {
    const failure = new Error('stock insuficiente');

    await expect(
      run(() => {
        throw failure;
      }),
    ).rejects.toBe(failure);

    expect(executedSql()).toEqual(['BEGIN', 'ROLLBACK']);
    expect(executedSql()).not.toContain('COMMIT');
    expect(client.release).toHaveBeenCalledWith(undefined);
  });

  it('hace ROLLBACK si falla el COMMIT', async () => {
    const commitError = new Error('serialization failure');
    client.query.mockImplementation((sql: string) =>
      sql === 'COMMIT'
        ? Promise.reject(commitError)
        : Promise.resolve({ rows: [] }),
    );

    await expect(run(() => Promise.resolve('x'))).rejects.toBe(commitError);

    expect(executedSql()).toEqual(['BEGIN', 'COMMIT', 'ROLLBACK']);
  });

  it('descarta el cliente si el ROLLBACK falla y relanza el error original', async () => {
    const failure = new Error('fallo de negocio');
    const rollbackError = new Error('conexión perdida');
    client.query.mockImplementation((sql: string) =>
      sql === 'ROLLBACK'
        ? Promise.reject(rollbackError)
        : Promise.resolve({ rows: [] }),
    );

    await expect(run(() => Promise.reject(failure))).rejects.toBe(failure);

    expect(client.release).toHaveBeenCalledWith(rollbackError);
  });

  it('no toma conexión del pool si falla el connect', async () => {
    pool.connect.mockRejectedValue(new Error('pool agotado'));

    await expect(run(() => Promise.resolve())).rejects.toThrow('pool agotado');

    expect(client.release).not.toHaveBeenCalled();
  });

  it('reutiliza una transacción existente sin BEGIN, COMMIT ni release', async () => {
    const existing = client as unknown as PoolClient;

    const result = await run(async (c) => {
      await c.query('INSERT INTO inventory_movements ...');
      return 42;
    }, existing);

    expect(result).toBe(42);
    expect(pool.connect).not.toHaveBeenCalled();
    expect(executedSql()).toEqual(['INSERT INTO inventory_movements ...']);
    expect(client.release).not.toHaveBeenCalled();
  });
});
