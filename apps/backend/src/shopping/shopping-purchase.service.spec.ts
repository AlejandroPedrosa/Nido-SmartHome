import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { InventoryService, MovementType } from '../inventory';
import { ShoppingService } from './shopping.service';

describe('ShoppingService.purchase (RF-14)', () => {
  let client: { query: jest.Mock; release: jest.Mock };
  let applyMovement: jest.Mock;
  let service: ShoppingService;
  let listRows: object[];
  let purchasedRows: object[];

  const sql = (): string[] =>
    client.query.mock.calls.map(([text]) =>
      (text as string).replace(/\s+/g, ' ').trim(),
    );

  beforeEach(() => {
    listRows = [{ is_purchased: false }];
    purchasedRows = [
      { product_id: 'prod-1', suggested_quantity: 380 },
      { product_id: 'prod-2', suggested_quantity: 12 },
    ];
    client = {
      query: jest.fn((text: string) => {
        const q = text.replace(/\s+/g, ' ');
        if (q.includes('SELECT is_purchased FROM shopping_lists')) {
          return Promise.resolve({ rows: listRows, rowCount: listRows.length });
        }
        if (
          q.includes(
            'FROM shopping_list_items WHERE shopping_list_id = $1 AND purchased',
          )
        ) {
          return Promise.resolve({
            rows: purchasedRows,
            rowCount: purchasedRows.length,
          });
        }
        if (q.includes('FROM shopping_lists l WHERE l.id = $1')) {
          return Promise.resolve({
            rows: [{ id: 'list-1', is_purchased: true }],
            rowCount: 1,
          });
        }
        return Promise.resolve({ rows: [], rowCount: 1 });
      }),
      release: jest.fn(),
    };
    applyMovement = jest
      .fn()
      .mockResolvedValue({ movement: {}, current_stock: 0 });
    service = new ShoppingService(
      { connect: jest.fn().mockResolvedValue(client) } as unknown as Pool,
      { applyMovement } as unknown as InventoryService,
    );
  });

  it('suma al stock solo los comprados, archiva la lista y hace COMMIT', async () => {
    const result = await service.purchase('user-1', 'list-1');

    expect(sql()[1]).toContain('FOR UPDATE');
    expect(applyMovement).toHaveBeenCalledTimes(2);
    expect(applyMovement).toHaveBeenNthCalledWith(
      1,
      {
        userId: 'user-1',
        productId: 'prod-1',
        quantityChange: 380,
        type: MovementType.Shopping,
        reason: 'Compra confirmada',
      },
      client as unknown as PoolClient,
    );
    expect(sql()).toContainEqual(
      expect.stringContaining(
        'SET is_purchased = TRUE, purchased_at = NOW() WHERE id = $1',
      ),
    );
    expect(sql().at(-1)).toBe('COMMIT');
    expect(result.is_purchased).toBe(true);
  });

  it('responde 409 si la lista ya fue confirmada (LC-04)', async () => {
    listRows = [{ is_purchased: true }];

    await expect(service.purchase('user-1', 'list-1')).rejects.toThrow(
      new ConflictException('La lista de compras ya fue confirmada'),
    );
    expect(applyMovement).not.toHaveBeenCalled();
    expect(sql().at(-1)).toBe('ROLLBACK');
  });

  it('responde 400 si no hay ítems comprados (LC-05)', async () => {
    purchasedRows = [];

    await expect(service.purchase('user-1', 'list-1')).rejects.toThrow(
      new BadRequestException('No hay artículos marcados como comprados'),
    );
    expect(sql()).not.toContainEqual(
      expect.stringContaining('SET is_purchased = TRUE'),
    );
  });

  it('responde 404 si la lista es ajena', async () => {
    listRows = [];

    await expect(service.purchase('user-1', 'list-x')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('si falla un movimiento no archiva la lista y revierte todo', async () => {
    applyMovement
      .mockResolvedValueOnce({ movement: {}, current_stock: 500 })
      .mockRejectedValueOnce(new Error('fallo de auditoría'));

    await expect(service.purchase('user-1', 'list-1')).rejects.toThrow(
      'fallo de auditoría',
    );
    expect(sql()).not.toContainEqual(
      expect.stringContaining('SET is_purchased = TRUE'),
    );
    expect(sql().at(-1)).toBe('ROLLBACK');
  });
});
