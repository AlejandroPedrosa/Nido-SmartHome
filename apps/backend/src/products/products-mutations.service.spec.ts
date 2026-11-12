import { ConflictException, NotFoundException } from '@nestjs/common';
import { DatabaseError, Pool } from 'pg';
import { Unit } from '../common/enums/unit.enum';
import { InventoryService } from '../inventory';
import { ProductsService } from './products.service';

const productRow = {
  id: 'prod-1',
  name: 'Fideos',
  category: null,
  unit: Unit.Gram,
  current_stock: 750,
  min_stock: 500,
  reorder_quantity: null,
  created_at: new Date('2026-11-11T12:00:00Z'),
};

function fkViolation(constraint: string): DatabaseError {
  const error = new DatabaseError('violates foreign key', 0, 'error');
  error.code = '23503';
  error.constraint = constraint;
  error.detail = 'Key (id)=(prod-1) is still referenced from table.';
  return error;
}

describe('ProductsService (update / remove)', () => {
  const pool = { query: jest.fn() };
  const service = new ProductsService(
    pool as unknown as Pool,
    {} as InventoryService,
  );

  const sqlOf = (index: number) =>
    (pool.query.mock.calls[index][0] as string).replace(/\s+/g, ' ');

  beforeEach(() => jest.clearAllMocks());

  describe('update', () => {
    const mockFindOne = () =>
      pool.query.mockResolvedValueOnce({
        rows: [{ ...productRow, containers: [] }],
        rowCount: 1,
      });

    it('actualiza solo los campos enviados y devuelve el detalle', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });
      mockFindOne();

      const result = await service.update('user-1', 'prod-1', {
        name: 'Fideos Moñito',
        reorder_quantity: null,
      });

      expect(sqlOf(0)).toContain(
        'UPDATE products SET name = $3, reorder_quantity = $4 WHERE id = $1 AND user_id = $2',
      );
      expect(pool.query.mock.calls[0][1]).toEqual([
        'prod-1',
        'user-1',
        'Fideos Moñito',
        null,
      ]);
      expect(result.id).toBe('prod-1');
    });

    it('nunca incluye current_stock en el UPDATE', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });
      mockFindOne();

      await service.update('user-1', 'prod-1', {
        min_stock: 100,
        current_stock: 9999,
      } as never);

      expect(sqlOf(0)).not.toContain('current_stock');
    });

    it('con body vacío no ejecuta UPDATE y devuelve el producto', async () => {
      mockFindOne();

      await service.update('user-1', 'prod-1', {});

      expect(sqlOf(0)).toContain('SELECT');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('responde 404 si el producto no es del usuario', async () => {
      pool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(
        service.update('user-1', 'prod-x', { min_stock: 1 }),
      ).rejects.toThrow(new NotFoundException('Producto no encontrado'));
    });
  });

  describe('remove', () => {
    const noRecipes = { rows: [], rowCount: 0 };

    it('verifica recetas y luego elimina el producto del usuario', async () => {
      pool.query
        .mockResolvedValueOnce(noRecipes)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await expect(service.remove('user-1', 'prod-1')).resolves.toBeUndefined();
      expect(sqlOf(0)).toContain('FROM recipe_ingredients');
      expect(sqlOf(1)).toContain('DELETE FROM products');
      expect(pool.query.mock.calls[1][1]).toEqual(['prod-1', 'user-1']);
    });

    it('responde 404 si no existe o es ajeno', async () => {
      pool.query
        .mockResolvedValueOnce(noRecipes)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(service.remove('user-1', 'prod-x')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('responde 409 con las recetas que lo usan, sin intentar borrar (RC-06)', async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ name: 'Pasta con salsa' }, { name: 'Tarta' }],
        rowCount: 2,
      });

      await expect(service.remove('user-1', 'prod-1')).rejects.toThrow(
        new ConflictException(
          'No se puede eliminar: el producto es ingrediente de "Pasta con salsa", "Tarta". Quitalo de esas recetas primero',
        ),
      );
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('si la FK lo impide por una carrera, el error llega al filtro global', async () => {
      const race = fkViolation('recipe_ingredients_product_id_fkey');
      pool.query.mockResolvedValueOnce(noRecipes).mockRejectedValueOnce(race);

      await expect(service.remove('user-1', 'prod-1')).rejects.toBe(race);
    });
  });
});
