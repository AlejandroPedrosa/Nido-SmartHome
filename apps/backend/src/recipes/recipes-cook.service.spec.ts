import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { Unit } from '../common/enums/unit.enum';
import { InventoryService, MovementType } from '../inventory';
import { RecipesService } from './recipes.service';

const ingredients = [
  {
    product_id: 'prod-1',
    product_name: 'Fideos',
    unit: Unit.Gram,
    quantity: 200,
    current_stock: 750,
  },
  {
    product_id: 'prod-2',
    product_name: 'Salsa',
    unit: Unit.Milliliter,
    quantity: 300,
    current_stock: 500,
  },
];

describe('RecipesService.cook (RF-11)', () => {
  let client: { query: jest.Mock; release: jest.Mock };
  let applyMovement: jest.Mock;
  let service: RecipesService;
  let recipeRows: object[];
  let ingredientRows: object[];

  const sql = (): string[] =>
    client.query.mock.calls.map(([text]) =>
      (text as string).replace(/\s+/g, ' ').trim(),
    );

  beforeEach(() => {
    recipeRows = [{ name: 'Pasta con salsa' }];
    ingredientRows = ingredients.map((i) => ({ ...i }));
    client = {
      query: jest.fn((text: string) => {
        if (text.includes('FROM recipes')) {
          return Promise.resolve({
            rows: recipeRows,
            rowCount: recipeRows.length,
          });
        }
        if (text.includes('FROM recipe_ingredients')) {
          return Promise.resolve({
            rows: ingredientRows,
            rowCount: ingredientRows.length,
          });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      }),
      release: jest.fn(),
    };
    applyMovement = jest.fn(({ quantityChange, productId }) =>
      Promise.resolve({
        movement: { id: `mov-${productId}` },
        current_stock:
          ingredients.find((i) => i.product_id === productId)!.current_stock +
          quantityChange,
      }),
    );
    const pool = { connect: jest.fn().mockResolvedValue(client) };
    service = new RecipesService(
      pool as unknown as Pool,
      {
        applyMovement,
      } as unknown as InventoryService,
    );
  });

  it('bloquea receta y productos, descuenta todo y hace COMMIT', async () => {
    const result = await service.cook('user-1', 'rec-1');

    const statements = sql();
    expect(statements[0]).toBe('BEGIN');
    expect(statements[1]).toContain(
      'FROM recipes WHERE id = $1 AND user_id = $2 FOR SHARE',
    );
    expect(statements[2]).toContain('ORDER BY p.id FOR UPDATE OF p');
    expect(statements.at(-1)).toBe('COMMIT');

    expect(applyMovement).toHaveBeenCalledTimes(2);
    expect(applyMovement).toHaveBeenNthCalledWith(
      1,
      {
        userId: 'user-1',
        productId: 'prod-1',
        quantityChange: -200,
        type: MovementType.RecipeConsumption,
        reason: 'Receta: Pasta con salsa',
      },
      client as unknown as PoolClient,
    );

    expect(result).toEqual({
      recipe_id: 'rec-1',
      recipe_name: 'Pasta con salsa',
      consumed: [
        expect.objectContaining({ product_id: 'prod-1', current_stock: 550 }),
        expect.objectContaining({ product_id: 'prod-2', current_stock: 200 }),
      ],
    });
  });

  it('con stock exacto cocina (current_stock >= quantity)', async () => {
    ingredientRows = [{ ...ingredients[0], current_stock: 200 }];

    await expect(service.cook('user-1', 'rec-1')).resolves.toBeDefined();
    expect(applyMovement).toHaveBeenCalledTimes(1);
  });

  it('responde 400 con los faltantes, no descuenta nada y hace ROLLBACK (RS-04)', async () => {
    ingredientRows = [
      ingredients[0],
      { ...ingredients[1], current_stock: 100 },
    ];

    const error = await service
      .cook('user-1', 'rec-1')
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Stock insuficiente para cocinar "Pasta con salsa"',
      missing: [
        {
          product_id: 'prod-2',
          product_name: 'Salsa',
          unit: Unit.Milliliter,
          required: 300,
          available: 100,
        },
      ],
    });
    expect(applyMovement).not.toHaveBeenCalled();
    expect(sql().at(-1)).toBe('ROLLBACK');
  });

  it('responde 404 si la receta es ajena, sin bloquear productos', async () => {
    recipeRows = [];

    await expect(service.cook('user-1', 'rec-x')).rejects.toThrow(
      new NotFoundException('Receta no encontrada'),
    );
    expect(sql().some((s) => s.includes('FOR UPDATE'))).toBe(false);
  });

  it('si falla un movimiento intermedio se revierte todo', async () => {
    applyMovement
      .mockResolvedValueOnce({ movement: {}, current_stock: 550 })
      .mockRejectedValueOnce(new Error('fallo de auditoría'));

    await expect(service.cook('user-1', 'rec-1')).rejects.toThrow(
      'fallo de auditoría',
    );
    expect(sql().at(-1)).toBe('ROLLBACK');
  });
});
