import { NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { InventoryService } from '../inventory';
import { CreateRecipeDto } from './dto/recipe.dto';
import { RecipesService } from './recipes.service';

const recipeRow = {
  id: 'rec-1',
  name: 'Pasta con salsa',
  instructions: null,
  servings: 2,
  created_at: new Date('2026-11-11T12:00:00Z'),
};

const ingredientRows = [
  {
    product_id: 'prod-1',
    product_name: 'Fideos',
    unit: 'g',
    quantity: 200,
    current_stock: 750,
    available: true,
  },
  {
    product_id: 'prod-2',
    product_name: 'Salsa',
    unit: 'ml',
    quantity: 300,
    current_stock: 100,
    available: false,
  },
];

const dto = (): CreateRecipeDto =>
  Object.assign(new CreateRecipeDto(), {
    name: 'Pasta con salsa',
    servings: 2,
    ingredients: [
      { product_id: 'prod-1', quantity: 200 },
      { product_id: 'prod-2', quantity: 300 },
    ],
  });

describe('RecipesService (CRUD)', () => {
  /** Cliente transaccional: responde según el SQL recibido. */
  let client: { query: jest.Mock; release: jest.Mock };
  let pool: { query: jest.Mock; connect: jest.Mock };
  let service: RecipesService;
  let ownedProducts: string[];

  const txSql = (): string[] =>
    client.query.mock.calls.map(([sql]) =>
      (sql as string).replace(/\s+/g, ' ').trim(),
    );

  beforeEach(() => {
    ownedProducts = ['prod-1', 'prod-2'];
    client = {
      query: jest.fn((sql: string, params?: unknown[]) => {
        if (sql.includes('FROM products WHERE id = ANY')) {
          // Devuelve solo los productos pedidos que pertenecen al usuario.
          const requested = (params?.[0] ?? []) as string[];
          const owned = requested.filter((id) => ownedProducts.includes(id));
          return Promise.resolve({
            rows: owned.map((id) => ({ id })),
            rowCount: owned.length,
          });
        }
        if (sql.includes('INSERT INTO recipes')) {
          return Promise.resolve({ rows: [{ id: 'rec-1' }], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 1 });
      }),
      release: jest.fn(),
    };
    pool = {
      connect: jest.fn().mockResolvedValue(client),
      // findOne: receta + ingredientes
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [recipeRow], rowCount: 1 })
        .mockResolvedValueOnce({ rows: ingredientRows, rowCount: 2 }),
    };
    service = new RecipesService(
      pool as unknown as Pool,
      {} as InventoryService,
    );
  });

  describe('findAll', () => {
    it('incluye ingredientes y can_cook de cada receta en una sola consulta (RC-04)', async () => {
      const listRow = {
        id: 'rec-1',
        name: 'Pasta con salsa',
        servings: 2,
        created_at: recipeRow.created_at,
        ingredient_count: 2,
        ingredients: ingredientRows,
        can_cook: false,
      };
      pool.query.mockReset().mockResolvedValueOnce({
        rows: [listRow],
        rowCount: 1,
      });

      const result = await service.findAll('user-1');

      expect(result).toEqual([listRow]);
      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0] as [string, unknown[]];
      const flat = sql.replace(/\s+/g, ' ');
      expect(params).toEqual(['user-1']);
      expect(flat).toContain('LEFT JOIN LATERAL');
      expect(flat).toContain(
        "COALESCE(ing.ingredients, '[]'::json) AS ingredients",
      );
      expect(flat).toContain('COALESCE(ing.can_cook, TRUE) AS can_cook');
      expect(flat).toContain('bool_and(p.current_stock >= ri.quantity)');
      expect(flat).toContain('p.user_id = r.user_id');
      expect(flat).toContain('WHERE r.user_id = $1 ORDER BY LOWER(r.name)');
    });
  });

  describe('findOne', () => {
    it('devuelve ingredientes con disponibilidad y can_cook (RC-04)', async () => {
      const result = await service.findOne('user-1', 'rec-1');

      expect(result.ingredients).toHaveLength(2);
      expect(result.can_cook).toBe(false);
      expect(pool.query.mock.calls[1][1]).toEqual(['rec-1', 'user-1']);
    });

    it('can_cook es true si todos los ingredientes alcanzan', async () => {
      pool.query
        .mockReset()
        .mockResolvedValueOnce({ rows: [recipeRow], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [ingredientRows[0]], rowCount: 1 });

      expect((await service.findOne('user-1', 'rec-1')).can_cook).toBe(true);
    });

    it('responde 404 si es ajena (MT-03)', async () => {
      pool.query.mockReset().mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(service.findOne('user-1', 'rec-x')).rejects.toThrow(
        new NotFoundException('Receta no encontrada'),
      );
    });
  });

  describe('create', () => {
    it('valida los productos, inserta receta e ingredientes en una transacción', async () => {
      const result = await service.create('user-1', dto());

      const sql = txSql();
      expect(sql[0]).toBe('BEGIN');
      expect(sql[1]).toContain(
        'FROM products WHERE id = ANY($1::uuid[]) AND user_id = $2',
      );
      expect(sql[2]).toContain('INSERT INTO recipes');
      expect(sql[3]).toContain('unnest($2::uuid[], $3::numeric[])');
      expect(sql.at(-1)).toBe('COMMIT');
      expect(client.query.mock.calls[3][1]).toEqual([
        'rec-1',
        ['prod-1', 'prod-2'],
        [200, 300],
      ]);
      expect(result.id).toBe('rec-1');
    });

    it('responde 404 y hace ROLLBACK si un producto es ajeno (RC-01)', async () => {
      ownedProducts = ['prod-1'];

      await expect(service.create('user-1', dto())).rejects.toThrow(
        new NotFoundException(
          'Uno o más ingredientes no corresponden a productos existentes',
        ),
      );
      expect(txSql()).not.toContainEqual(
        expect.stringContaining('INSERT INTO recipes'),
      );
      expect(txSql().at(-1)).toBe('ROLLBACK');
    });
  });

  describe('update', () => {
    it('actualiza campos y reemplaza ingredientes en la misma transacción', async () => {
      await service.update('user-1', 'rec-1', {
        name: 'Pasta',
        ingredients: [{ product_id: 'prod-1', quantity: 250 }],
      });

      const sql = txSql();
      expect(sql[1]).toContain(
        'UPDATE recipes SET name = $3 WHERE id = $1 AND user_id = $2',
      );
      expect(sql[2]).toContain('FROM products WHERE id = ANY');
      expect(sql[3]).toContain('DELETE FROM recipe_ingredients');
      expect(sql[4]).toContain('INSERT INTO recipe_ingredients');
      expect(sql.at(-1)).toBe('COMMIT');
    });

    it('sin campos de receta verifica la pertenencia con FOR UPDATE', async () => {
      await service.update('user-1', 'rec-1', {
        ingredients: [{ product_id: 'prod-1', quantity: 1 }],
      });

      expect(txSql()[1]).toContain('FOR UPDATE');
    });

    it('sin ingredientes no toca recipe_ingredients', async () => {
      await service.update('user-1', 'rec-1', { servings: 4 });

      expect(txSql().join(' ')).not.toContain('recipe_ingredients');
    });

    it('responde 404 si la receta es ajena', async () => {
      client.query.mockImplementation((sql: string) =>
        Promise.resolve(
          sql.startsWith('UPDATE') ? { rows: [], rowCount: 0 } : { rows: [] },
        ),
      );

      await expect(
        service.update('user-1', 'rec-x', { name: 'X' }),
      ).rejects.toThrow(new NotFoundException('Receta no encontrada'));
    });
  });

  describe('remove', () => {
    it('elimina la receta del usuario', async () => {
      pool.query.mockReset().mockResolvedValueOnce({ rows: [], rowCount: 1 });

      await expect(service.remove('user-1', 'rec-1')).resolves.toBeUndefined();
      expect(pool.query.mock.calls[0][1]).toEqual(['rec-1', 'user-1']);
    });

    it('responde 404 si es ajena', async () => {
      pool.query.mockReset().mockResolvedValueOnce({ rows: [], rowCount: 0 });

      await expect(service.remove('user-1', 'rec-x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
