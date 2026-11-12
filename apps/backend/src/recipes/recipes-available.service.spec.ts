import { Pool } from 'pg';
import { RecipesService } from './recipes.service';

describe('RecipesService.findAvailable (RC-04)', () => {
  const pool = { query: jest.fn() };
  const service = new RecipesService(pool as unknown as Pool);

  beforeEach(() => jest.clearAllMocks());

  it('resuelve en una consulta con bool_and sobre todos los ingredientes', async () => {
    const rows = [
      {
        id: 'rec-1',
        name: 'Pasta',
        servings: 2,
        created_at: new Date(),
        ingredient_count: 2,
        times_available: 3,
      },
    ];
    pool.query.mockResolvedValue({ rows, rowCount: 1 });

    await expect(service.findAvailable('user-1')).resolves.toBe(rows);

    const [sql, params] = pool.query.mock.calls[0] as [string, unknown[]];
    const normalized = sql.replace(/\s+/g, ' ');
    expect(normalized).toContain(
      'HAVING bool_and(p.current_stock >= ri.quantity)',
    );
    expect(normalized).toContain('p.user_id = r.user_id');
    expect(normalized).toContain(
      'FLOOR(MIN(p.current_stock / ri.quantity))::int AS times_available',
    );
    expect(params).toEqual(['user-1']);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('devuelve una lista vacía si no hay recetas cocinables', async () => {
    pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

    await expect(service.findAvailable('user-1')).resolves.toEqual([]);
  });
});
