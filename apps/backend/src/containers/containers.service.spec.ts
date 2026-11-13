import { NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { ContainersService } from './containers.service';

const container = {
  id: 'cont-1',
  name: 'Alacena',
  created_at: new Date('2026-11-11T12:00:00Z'),
  product_count: 3,
  low_stock_count: 1,
};

describe('ContainersService (CRUD)', () => {
  const pool = { query: jest.fn() };
  const service = new ContainersService(pool as unknown as Pool);

  const call = () => {
    const [sql, params] = pool.query.mock.calls.at(-1) as [string, unknown[]];
    return { sql: sql.replace(/\s+/g, ' '), params };
  };

  beforeEach(() => jest.clearAllMocks());

  it('findAll lista los contenedores del usuario con sus conteos de productos y faltantes', async () => {
    pool.query.mockResolvedValue({ rows: [container], rowCount: 1 });

    await expect(service.findAll('user-1')).resolves.toEqual([container]);
    expect(call().sql).toContain('AS product_count');
    expect(call().sql).toContain(
      'p.current_stock < p.min_stock) AS low_stock_count',
    );
    expect(call().sql).toContain('WHERE c.user_id = $1 ORDER BY LOWER(c.name)');
    expect(call().params).toEqual(['user-1']);
  });

  it('create inserta con el user_id del token', async () => {
    pool.query.mockResolvedValue({
      rows: [{ ...container, product_count: 0, low_stock_count: 0 }],
      rowCount: 1,
    });

    const result = await service.create('user-1', { name: 'Despensa' });

    expect(result.product_count).toBe(0);
    expect(call().params).toEqual(['user-1', 'Despensa']);
  });

  describe('update', () => {
    it('renombra el contenedor del usuario', async () => {
      pool.query.mockResolvedValue({ rows: [container], rowCount: 1 });

      await service.update('user-1', 'cont-1', { name: 'Alacena grande' });

      expect(call().sql).toContain('WHERE c.id = $1 AND c.user_id = $2');
      expect(call().params).toEqual(['cont-1', 'user-1', 'Alacena grande']);
    });

    it('responde 404 si es ajeno o no existe (MT-03)', async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(
        service.update('user-1', 'cont-x', { name: 'X' }),
      ).rejects.toThrow(new NotFoundException('Contenedor no encontrado'));
    });
  });

  describe('remove', () => {
    it('elimina el contenedor del usuario (CT-03)', async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 1 });

      await expect(service.remove('user-1', 'cont-1')).resolves.toBeUndefined();
      expect(call().params).toEqual(['cont-1', 'user-1']);
    });

    it('responde 404 si es ajeno o no existe', async () => {
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await expect(service.remove('user-1', 'cont-x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
