import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { InventoryService } from './inventory.service';
import { MovementType } from './interfaces/movement.interface';

const movementRow = {
  id: 'mov-1',
  product_id: 'prod-1',
  quantity_change: -250,
  type: MovementType.RecipeConsumption,
  reason: null,
  created_at: new Date('2026-11-11T12:00:00Z'),
};

describe('InventoryService.applyMovement', () => {
  let client: { query: jest.Mock; release: jest.Mock };
  let pool: { connect: jest.Mock };
  let service: InventoryService;

  const input = {
    userId: 'user-1',
    productId: 'prod-1',
    quantityChange: -250,
    type: MovementType.RecipeConsumption,
  };

  /** SQL ejecutado, sin BEGIN/COMMIT/ROLLBACK, normalizado a una línea. */
  const businessSql = (): string[] =>
    client.query.mock.calls
      .map(([sql]) => (sql as string).replace(/\s+/g, ' ').trim())
      .filter((sql) => !['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql));

  beforeEach(() => {
    client = { query: jest.fn(), release: jest.fn() };
    pool = { connect: jest.fn().mockResolvedValue(client) };
    service = new InventoryService(pool as unknown as Pool);
  });

  /** Encadena respuestas para UPDATE / SELECT / INSERT (BEGIN y COMMIT vacíos). */
  const mockResponses = (...responses: object[]) => {
    const queue = [...responses];
    client.query.mockImplementation((sql: string) =>
      ['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)
        ? Promise.resolve({ rows: [], rowCount: 0 })
        : Promise.resolve(queue.shift()),
    );
  };

  it('descuenta stock y registra el movimiento en una transacción propia', async () => {
    mockResponses(
      { rows: [{ current_stock: 500 }], rowCount: 1 },
      { rows: [movementRow], rowCount: 1 },
    );

    const result = await service.applyMovement(input);

    expect(result).toEqual({ movement: movementRow, current_stock: 500 });
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenLastCalledWith('COMMIT');
    expect(client.query.mock.calls[1][1]).toEqual(['prod-1', 'user-1', -250]);
    expect(client.query.mock.calls[2][1]).toEqual([
      'prod-1',
      -250,
      'recipe_consumption',
      null,
    ]);
    expect(client.release).toHaveBeenCalled();
  });

  it('filtra por user_id y exige stock no negativo en el mismo UPDATE', async () => {
    mockResponses(
      { rows: [{ current_stock: 500 }], rowCount: 1 },
      { rows: [movementRow], rowCount: 1 },
    );

    await service.applyMovement(input);

    expect(businessSql()[0]).toContain(
      'WHERE id = $1 AND user_id = $2 AND current_stock + $3 >= 0',
    );
  });

  it('usa la transacción del orquestador si recibe un cliente', async () => {
    const existing = { query: jest.fn(), release: jest.fn() };
    existing.query
      .mockResolvedValueOnce({ rows: [{ current_stock: 10 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [movementRow], rowCount: 1 });

    await service.applyMovement(input, existing as unknown as PoolClient);

    expect(pool.connect).not.toHaveBeenCalled();
    expect(existing.query).toHaveBeenCalledTimes(2);
    expect(existing.release).not.toHaveBeenCalled();
  });

  it('responde 400 con el detalle si el stock no alcanza y hace ROLLBACK', async () => {
    mockResponses(
      { rows: [], rowCount: 0 },
      { rows: [{ current_stock: 100, unit: 'g' }], rowCount: 1 },
    );

    await expect(service.applyMovement(input)).rejects.toThrow(
      new BadRequestException(
        'Stock insuficiente: disponible 100 g, se intentó descontar 250 g',
      ),
    );
    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
    expect(businessSql().some((sql) => sql.startsWith('INSERT'))).toBe(false);
  });

  it('responde 404 si el producto no existe o es de otro usuario (MT-03)', async () => {
    mockResponses({ rows: [], rowCount: 0 }, { rows: [], rowCount: 0 });

    await expect(service.applyMovement(input)).rejects.toThrow(
      new NotFoundException('Producto no encontrado'),
    );
  });

  it('rechaza una cantidad 0 sin tocar la base', async () => {
    await expect(
      service.applyMovement({ ...input, quantityChange: 0.001 }),
    ).rejects.toThrow(BadRequestException);
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it('redondea la cantidad a 2 decimales y normaliza el motivo', async () => {
    mockResponses(
      { rows: [{ current_stock: 1.3 }], rowCount: 1 },
      { rows: [movementRow], rowCount: 1 },
    );

    await service.applyMovement({
      ...input,
      type: MovementType.Manual,
      quantityChange: 0.1 + 0.2,
      reason: '  compra en el chino  ',
    });

    expect(client.query.mock.calls[1][1]).toEqual(['prod-1', 'user-1', 0.3]);
    expect(client.query.mock.calls[2][1]).toEqual([
      'prod-1',
      0.3,
      'manual',
      'compra en el chino',
    ]);
  });

  it('guarda null si el motivo está vacío', async () => {
    mockResponses(
      { rows: [{ current_stock: 1 }], rowCount: 1 },
      { rows: [movementRow], rowCount: 1 },
    );

    await service.applyMovement({ ...input, reason: '   ' });

    expect(client.query.mock.calls[2][1][3]).toBeNull();
  });
});
