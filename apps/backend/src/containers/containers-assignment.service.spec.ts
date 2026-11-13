import { NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { Unit } from '../common/enums/unit.enum';
import { StockStatus } from '../common/utils/stock-status';
import { ContainersService } from './containers.service';

const container = {
  id: 'cont-1',
  name: 'Alacena',
  created_at: new Date('2026-11-11T12:00:00Z'),
  product_count: 1,
};

const productRow = {
  id: 'prod-1',
  name: 'Fideos',
  category: null,
  unit: Unit.Gram,
  current_stock: 100,
  min_stock: 500,
  reorder_quantity: null,
  created_at: new Date('2026-11-11T12:00:00Z'),
};

const found = (rows: object[]) => ({ rows, rowCount: rows.length });
const none = { rows: [], rowCount: 0 };

describe('ContainersService (detalle y asignaciones)', () => {
  const pool = { query: jest.fn() };
  const service = new ContainersService(pool as unknown as Pool);

  const sqlOf = (index: number) =>
    (pool.query.mock.calls[index][0] as string).replace(/\s+/g, ' ');
  const paramsOf = (index: number) =>
    pool.query.mock.calls[index][1] as unknown[];

  beforeEach(() => jest.clearAllMocks());

  describe('findOne', () => {
    it('devuelve el contenedor con sus productos y estado de stock', async () => {
      pool.query
        .mockResolvedValueOnce(found([container]))
        .mockResolvedValueOnce(found([productRow]));

      const result = await service.findOne('user-1', 'cont-1');

      expect(result).toMatchObject({
        id: 'cont-1',
        products: [{ id: 'prod-1', stock_status: StockStatus.LowStock }],
      });
      expect(paramsOf(0)).toEqual(['cont-1', 'user-1']);
      expect(sqlOf(1)).toContain('pc.container_id = $1 AND p.user_id = $2');
    });

    it('responde 404 si el contenedor es ajeno', async () => {
      pool.query.mockResolvedValueOnce(none);

      await expect(service.findOne('user-1', 'cont-x')).rejects.toThrow(
        new NotFoundException('Contenedor no encontrado'),
      );
    });
  });

  describe('assignProduct', () => {
    it('verifica que ambos sean del usuario, inserta y devuelve el detalle', async () => {
      pool.query
        .mockResolvedValueOnce(found([container])) // contenedor propio
        .mockResolvedValueOnce(found([{}])) // producto propio
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // INSERT
        .mockResolvedValueOnce(found([container])) // findOne: contenedor
        .mockResolvedValueOnce(found([productRow])); // findOne: productos

      const result = await service.assignProduct('user-1', 'cont-1', 'prod-1');

      expect(paramsOf(1)).toEqual(['prod-1', 'user-1']);
      expect(sqlOf(2)).toContain('INSERT INTO product_containers');
      expect(paramsOf(2)).toEqual(['prod-1', 'cont-1']);
      expect(result.products).toHaveLength(1);
    });

    it('responde 404 si el contenedor es ajeno, sin buscar el producto', async () => {
      pool.query.mockResolvedValueOnce(none);

      await expect(
        service.assignProduct('user-1', 'cont-x', 'prod-1'),
      ).rejects.toThrow(new NotFoundException('Contenedor no encontrado'));
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('responde 404 si el producto es ajeno, sin insertar (MT-03)', async () => {
      pool.query
        .mockResolvedValueOnce(found([container]))
        .mockResolvedValueOnce(none);

      await expect(
        service.assignProduct('user-1', 'cont-1', 'prod-ajeno'),
      ).rejects.toThrow(new NotFoundException('Producto no encontrado'));
      expect(pool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('unassignProduct', () => {
    it('borra el vínculo del contenedor propio', async () => {
      pool.query
        .mockResolvedValueOnce(found([container]))
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await expect(
        service.unassignProduct('user-1', 'cont-1', 'prod-1'),
      ).resolves.toBeUndefined();
      expect(sqlOf(1)).toContain('DELETE FROM product_containers');
      expect(paramsOf(1)).toEqual(['cont-1', 'prod-1']);
    });

    it('responde 404 si el producto no estaba asignado', async () => {
      pool.query
        .mockResolvedValueOnce(found([container]))
        .mockResolvedValueOnce(none);

      await expect(
        service.unassignProduct('user-1', 'cont-1', 'prod-1'),
      ).rejects.toThrow(
        new NotFoundException('El producto no está asignado a ese contenedor'),
      );
    });

    it('responde 404 si el contenedor es ajeno', async () => {
      pool.query.mockResolvedValueOnce(none);

      await expect(
        service.unassignProduct('user-1', 'cont-x', 'prod-1'),
      ).rejects.toThrow(new NotFoundException('Contenedor no encontrado'));
    });
  });
});
