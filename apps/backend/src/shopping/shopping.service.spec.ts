import { NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { ShoppingService } from './shopping.service';

const list = {
  id: 'list-1',
  created_at: new Date('2026-11-11T12:00:00Z'),
  is_purchased: false,
  purchased_at: null,
  item_count: 2,
  purchased_count: 1,
};

describe('ShoppingService (consultas)', () => {
  const pool = { query: jest.fn() };
  const service = new ShoppingService(pool as unknown as Pool);

  const sqlOf = (index: number) =>
    (pool.query.mock.calls[index][0] as string).replace(/\s+/g, ' ');

  beforeEach(() => jest.clearAllMocks());

  it('findAll lista las del usuario con la activa primero', async () => {
    pool.query.mockResolvedValue({ rows: [list], rowCount: 1 });

    await expect(service.findAll('user-1')).resolves.toEqual([list]);
    expect(sqlOf(0)).toContain(
      'WHERE l.user_id = $1 ORDER BY l.is_purchased, l.created_at DESC',
    );
    expect(sqlOf(0)).toContain('AS purchased_count');
  });

  it('findOne devuelve la lista con sus ítems', async () => {
    const items = [{ product_id: 'prod-1', purchased: false }];
    pool.query
      .mockResolvedValueOnce({ rows: [list], rowCount: 1 })
      .mockResolvedValueOnce({ rows: items, rowCount: 1 });

    const result = await service.findOne('user-1', 'list-1');

    expect(result).toEqual({ ...list, items });
    expect(pool.query.mock.calls[0][1]).toEqual(['list-1', 'user-1']);
    expect(sqlOf(1)).toContain('i.shopping_list_id = $1 AND p.user_id = $2');
  });

  it('findOne responde 404 si la lista es ajena (MT-03)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    await expect(service.findOne('user-1', 'list-x')).rejects.toThrow(
      new NotFoundException('Lista de compras no encontrada'),
    );
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});
