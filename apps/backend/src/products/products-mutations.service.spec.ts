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
    let client: { query: jest.Mock; release: jest.Mock };
    let updateCount: number;
    let ownedContainers: object[];
    let txService: ProductsService;

    const statements = (): string[] =>
      client.query.mock.calls.map(([text]) =>
        (text as string).replace(/\s+/g, ' ').trim(),
      );
    const paramsOf = (fragment: string) =>
      client.query.mock.calls.find(([text]) =>
        (text as string).replace(/\s+/g, ' ').includes(fragment),
      )?.[1] as unknown[];

    beforeEach(() => {
      updateCount = 1;
      ownedContainers = [];
      client = {
        query: jest.fn((text: string) => {
          const q = text.replace(/\s+/g, ' ');
          if (q.startsWith('UPDATE products') || q.startsWith('SELECT 1')) {
            return Promise.resolve({ rows: [], rowCount: updateCount });
          }
          if (q.includes('FROM containers WHERE id = ANY')) {
            return Promise.resolve({
              rows: ownedContainers,
              rowCount: ownedContainers.length,
            });
          }
          if (q.includes('AS containers')) {
            return Promise.resolve({
              rows: [{ ...productRow, containers: ownedContainers }],
              rowCount: 1,
            });
          }
          return Promise.resolve({ rows: [], rowCount: 0 });
        }),
        release: jest.fn(),
      };
      txService = new ProductsService(
        { connect: jest.fn().mockResolvedValue(client) } as unknown as Pool,
        {} as InventoryService,
      );
    });

    it('actualiza solo los campos enviados y devuelve el detalle', async () => {
      const result = await txService.update('user-1', 'prod-1', {
        name: 'Fideos Moñito',
        reorder_quantity: null,
      });

      expect(statements()[1]).toBe(
        'UPDATE products SET name = $3, reorder_quantity = $4 WHERE id = $1 AND user_id = $2',
      );
      expect(client.query.mock.calls[1][1]).toEqual([
        'prod-1',
        'user-1',
        'Fideos Moñito',
        null,
      ]);
      expect(statements()).not.toContainEqual(
        expect.stringContaining('product_containers WHERE'),
      );
      expect(statements().at(-1)).toBe('COMMIT');
      expect(result.id).toBe('prod-1');
    });

    it('nunca incluye current_stock en el UPDATE', async () => {
      await txService.update('user-1', 'prod-1', {
        min_stock: 100,
        current_stock: 9999,
      } as never);

      expect(statements()[1]).not.toContain('current_stock');
    });

    it('con body vacío no ejecuta UPDATE: bloquea el producto y lo devuelve', async () => {
      await txService.update('user-1', 'prod-1', {});

      expect(statements()[1]).toBe(
        'SELECT 1 FROM products WHERE id = $1 AND user_id = $2 FOR UPDATE',
      );
      expect(statements()).not.toContainEqual(
        expect.stringContaining('UPDATE products SET'),
      );
    });

    it('responde 404 si el producto no es del usuario', async () => {
      updateCount = 0;

      await expect(
        txService.update('user-1', 'prod-x', { min_stock: 1 }),
      ).rejects.toThrow(new NotFoundException('Producto no encontrado'));
      expect(statements().at(-1)).toBe('ROLLBACK');
    });

    describe('container_ids (CT-01)', () => {
      it('reemplaza los contenedores en la misma transacción', async () => {
        ownedContainers = [
          { id: 'cont-1', name: 'Alacena' },
          { id: 'cont-2', name: 'Heladera' },
        ];

        const result = await txService.update('user-1', 'prod-1', {
          container_ids: ['cont-2', 'cont-1'],
        });

        expect(paramsOf('FROM containers WHERE id = ANY')).toEqual([
          ['cont-2', 'cont-1'],
          'user-1',
        ]);
        expect(paramsOf('container_id <> ALL')).toEqual([
          'prod-1',
          ['cont-2', 'cont-1'],
        ]);
        expect(
          statements().find((s) =>
            s.includes('INSERT INTO product_containers'),
          ),
        ).toContain('ON CONFLICT DO NOTHING');
        expect(statements().at(-1)).toBe('COMMIT');
        expect(result.containers).toEqual(ownedContainers);
      });

      it('con [] desvincula todos y no inserta', async () => {
        await txService.update('user-1', 'prod-1', { container_ids: [] });

        expect(paramsOf('container_id <> ALL')).toEqual(['prod-1', []]);
        expect(statements()).not.toContainEqual(
          expect.stringContaining('INSERT INTO product_containers'),
        );
      });

      it('responde 404 y revierte todo si un contenedor es ajeno (MT-02)', async () => {
        ownedContainers = [{ id: 'cont-1', name: 'Alacena' }];

        await expect(
          txService.update('user-1', 'prod-1', {
            name: 'Nuevo',
            container_ids: ['cont-1', 'cont-ajeno'],
          }),
        ).rejects.toThrow(
          new NotFoundException(
            'Uno o más contenedores no existen o no te pertenecen',
          ),
        );
        expect(statements()).not.toContainEqual(
          expect.stringContaining('DELETE FROM product_containers'),
        );
        expect(statements().at(-1)).toBe('ROLLBACK');
      });
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
