import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { InventoryService } from './inventory.service';
import { MovementType } from './interfaces/movement.interface';

describe('InventoryService (historial)', () => {
  const pool = { query: jest.fn() };
  const service = new InventoryService(pool as unknown as Pool);
  const page = { limit: 50, offset: 0 };

  const lastCall = () => {
    const [sql, params] = pool.query.mock.calls.at(-1) as [string, unknown[]];
    return { sql: sql.replace(/\s+/g, ' '), params };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  describe('findMovements', () => {
    it('filtra siempre por el dueño vía JOIN con products y ordena por fecha', async () => {
      const rows = [{ id: 'mov-1' }];
      pool.query.mockResolvedValue({ rows, rowCount: 1 });

      await expect(service.findMovements('user-1', page)).resolves.toBe(rows);

      const { sql, params } = lastCall();
      expect(sql).toContain('JOIN products p ON p.id = m.product_id');
      expect(sql).toContain('WHERE p.user_id = $1 ORDER BY m.created_at DESC');
      expect(sql).toContain('LIMIT $2 OFFSET $3');
      expect(params).toEqual(['user-1', 50, 0]);
    });

    it('agrega los filtros como parámetros (sin interpolar valores)', async () => {
      await service.findMovements('user-1', {
        productId: 'prod-1',
        type: MovementType.Shopping,
        from: '2026-11-01',
        to: '2026-11-10',
        limit: 10,
        offset: 20,
      });

      const { sql, params } = lastCall();
      expect(sql).toContain(
        'p.user_id = $1 AND m.product_id = $2 AND m.type = $3 AND m.created_at >= $4 AND m.created_at < $5',
      );
      expect(sql).not.toContain('prod-1');
      expect(params).toEqual([
        'user-1',
        'prod-1',
        'shopping',
        new Date('2026-11-01T00:00:00.000Z'),
        // "to" como fecha sola incluye el día completo
        new Date('2026-11-11T00:00:00.000Z'),
        10,
        20,
      ]);
    });

    it('con fecha y hora, "to" es inclusivo al milisegundo', async () => {
      await service.findMovements('user-1', {
        ...page,
        to: '2026-11-10T15:30:00Z',
      });

      expect(lastCall().params[1]).toEqual(
        new Date('2026-11-10T15:30:00.001Z'),
      );
    });

    it('acepta from y to en el mismo día', async () => {
      await expect(
        service.findMovements('user-1', {
          ...page,
          from: '2026-11-10',
          to: '2026-11-10',
        }),
      ).resolves.toEqual([]);
    });

    it('responde 400 si from es posterior a to', async () => {
      await expect(
        service.findMovements('user-1', {
          ...page,
          from: '2026-11-10',
          to: '2026-11-01',
        }),
      ).rejects.toThrow(new BadRequestException('from debe ser anterior a to'));
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe('findProductMovements', () => {
    it('responde 404 si el producto no es del usuario (MT-03)', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(
        service.findProductMovements('user-1', 'prod-ajeno', page),
      ).rejects.toThrow(new NotFoundException('Producto no encontrado'));
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('devuelve el historial filtrado por el producto', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{}], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 'mov-1' }], rowCount: 1 });

      await service.findProductMovements('user-1', 'prod-1', page);

      expect(pool.query.mock.calls[0][1]).toEqual(['prod-1', 'user-1']);
      expect(lastCall().params).toEqual(['user-1', 'prod-1', 50, 0]);
    });
  });
});
