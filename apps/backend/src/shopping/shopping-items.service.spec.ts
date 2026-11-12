import 'reflect-metadata';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Pool } from 'pg';
import { InventoryService } from '../inventory';
import { SetItemPurchasedDto } from './dto/set-item-purchased.dto';
import { ShoppingService } from './shopping.service';

describe('ShoppingService.setItemPurchased (RF-13)', () => {
  let client: { query: jest.Mock; release: jest.Mock };
  let service: ShoppingService;
  let listRows: object[];
  let updatedCount: number;

  const sql = (): string[] =>
    client.query.mock.calls.map(([text]) =>
      (text as string).replace(/\s+/g, ' ').trim(),
    );

  beforeEach(() => {
    listRows = [{ is_purchased: false }];
    updatedCount = 1;
    client = {
      query: jest.fn((text: string) => {
        const q = text.replace(/\s+/g, ' ');
        if (q.includes('SELECT is_purchased FROM shopping_lists')) {
          return Promise.resolve({ rows: listRows, rowCount: listRows.length });
        }
        if (q.startsWith('UPDATE shopping_list_items')) {
          return Promise.resolve({ rows: [], rowCount: updatedCount });
        }
        if (q.includes('FROM shopping_lists l WHERE l.id = $1')) {
          return Promise.resolve({ rows: [{ id: 'list-1' }], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      }),
      release: jest.fn(),
    };
    service = new ShoppingService(
      {
        connect: jest.fn().mockResolvedValue(client),
      } as unknown as Pool,
      {} as InventoryService,
    );
  });

  it('bloquea la lista, actualiza el ítem y devuelve la lista', async () => {
    const result = await service.setItemPurchased(
      'user-1',
      'list-1',
      'prod-1',
      true,
    );

    expect(sql()[1]).toContain('FOR UPDATE');
    expect(client.query.mock.calls[2][1]).toEqual(['list-1', 'prod-1', true]);
    expect(sql().at(-1)).toBe('COMMIT');
    expect(result.id).toBe('list-1');
  });

  it('responde 409 si la lista ya fue confirmada', async () => {
    listRows = [{ is_purchased: true }];

    await expect(
      service.setItemPurchased('user-1', 'list-1', 'prod-1', false),
    ).rejects.toThrow(
      new ConflictException('La lista de compras ya fue confirmada'),
    );
    expect(sql().some((s) => s.startsWith('UPDATE'))).toBe(false);
  });

  it('responde 404 si la lista es ajena', async () => {
    listRows = [];

    await expect(
      service.setItemPurchased('user-1', 'list-x', 'prod-1', true),
    ).rejects.toThrow(new NotFoundException('Lista de compras no encontrada'));
  });

  it('responde 404 si el producto no está en la lista', async () => {
    updatedCount = 0;

    await expect(
      service.setItemPurchased('user-1', 'list-1', 'prod-x', true),
    ).rejects.toThrow(new NotFoundException('El producto no está en la lista'));
    expect(sql().at(-1)).toBe('ROLLBACK');
  });
});

describe('SetItemPurchasedDto', () => {
  const messages = (body: Record<string, unknown>) =>
    validateSync(plainToInstance(SetItemPurchasedDto, body), {
      stopAtFirstError: true,
    }).flatMap((e) => Object.values(e.constraints ?? {}));

  it('acepta true y false', () => {
    expect(messages({ purchased: true })).toEqual([]);
    expect(messages({ purchased: false })).toEqual([]);
  });

  it.each([
    [{}, 'purchased es obligatorio'],
    [{ purchased: 'true' }, 'purchased debe ser true o false'],
    [{ purchased: 1 }, 'purchased debe ser true o false'],
  ])('rechaza %j', (body, message) => {
    expect(messages(body)).toEqual([message]);
  });
});
