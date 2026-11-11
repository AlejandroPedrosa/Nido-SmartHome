import { NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { Unit } from '../common/enums/unit.enum';
import { InventoryService } from '../inventory';
import { StockStatus } from '../common/utils/stock-status';
import { ProductRow } from './interfaces/product.interface';
import { ProductsService } from './products.service';

const row = (overrides: Partial<ProductRow> = {}): ProductRow => ({
  id: 'prod-1',
  name: 'Fideos Tallarines',
  category: 'Alimentos',
  unit: Unit.Gram,
  current_stock: 750,
  min_stock: 500,
  reorder_quantity: null,
  created_at: new Date('2026-11-11T12:00:00Z'),
  ...overrides,
});

describe('ProductsService (consultas)', () => {
  const pool = { query: jest.fn() };
  const service = new ProductsService(
    pool as unknown as Pool,
    {} as InventoryService,
  );

  const call = (index = -1) => {
    const [sql, params] = pool.query.mock.calls.at(index) as [
      string,
      unknown[],
    ];
    return { sql: sql.replace(/\s+/g, ' '), params };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  describe('findAll', () => {
    it('lista los productos del usuario con su estado de stock', async () => {
      pool.query.mockResolvedValue({
        rows: [row(), row({ id: 'prod-2', current_stock: 0 })],
        rowCount: 2,
      });

      const result = await service.findAll('user-1', {});

      expect(result.map((p) => p.stock_status)).toEqual([
        StockStatus.Ok,
        StockStatus.OutOfStock,
      ]);
      expect(call().sql).toContain(
        'WHERE p.user_id = $1 ORDER BY LOWER(p.name)',
      );
      expect(call().params).toEqual(['user-1']);
    });

    it('combina todos los filtros como parámetros', async () => {
      await service.findAll('user-1', {
        name: 'fide',
        category: 'alimentos',
        low_stock: true,
        container_id: 'cont-1',
      });

      const { sql, params } = call();
      expect(sql).toContain("p.name ILIKE '%' || $2 || '%'");
      expect(sql).toContain('LOWER(p.category) = LOWER($3)');
      expect(sql).toContain('p.current_stock < p.min_stock');
      expect(sql).toContain('pc.container_id = $4 AND c.user_id = $1');
      expect(params).toEqual(['user-1', 'fide', 'alimentos', 'cont-1']);
    });

    it('escapa los comodines de LIKE en la búsqueda por nombre', async () => {
      await service.findAll('user-1', { name: '50%_off\\' });

      expect(call().params[1]).toBe('50\\%\\_off\\\\');
    });

    it('low_stock=false no filtra', async () => {
      await service.findAll('user-1', { low_stock: false });

      expect(call().sql).not.toContain('current_stock < p.min_stock');
    });
  });

  describe('findLowStock', () => {
    it('devuelve los productos bajo mínimo con la cantidad sugerida', async () => {
      pool.query.mockResolvedValue({
        rows: [
          row({ current_stock: 120, min_stock: 500 }),
          row({
            id: 'prod-2',
            current_stock: 1,
            min_stock: 6,
            reorder_quantity: 12,
          }),
        ],
        rowCount: 2,
      });

      const result = await service.findLowStock('user-1');

      expect(result.map((p) => p.suggested_quantity)).toEqual([380, 12]);
      expect(result[0].stock_status).toBe(StockStatus.LowStock);
      expect(call().sql).toContain(
        'p.user_id = $1 AND p.current_stock < p.min_stock',
      );
    });
  });

  describe('findOne', () => {
    it('devuelve el detalle con sus contenedores', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [row()], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [{ id: 'cont-1', name: 'Alacena' }],
          rowCount: 1,
        });

      const result = await service.findOne('user-1', 'prod-1');

      expect(result).toMatchObject({
        id: 'prod-1',
        stock_status: StockStatus.Ok,
        containers: [{ id: 'cont-1', name: 'Alacena' }],
      });
      expect(call(0).params).toEqual(['prod-1', 'user-1']);
      expect(call(1).sql).toContain('c.user_id = $2');
    });

    it('responde 404 si el producto no existe o es ajeno (MT-03)', async () => {
      await expect(service.findOne('user-1', 'prod-x')).rejects.toThrow(
        new NotFoundException('Producto no encontrado'),
      );
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });
});
