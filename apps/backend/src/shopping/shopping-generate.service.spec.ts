import { Pool } from 'pg';
import { ShoppingService } from './shopping.service';

const lowStock = [
  { id: 'prod-1', current_stock: 120, min_stock: 500, reorder_quantity: null },
  { id: 'prod-2', current_stock: 0, min_stock: 6, reorder_quantity: 12 },
];

const listRow = {
  id: 'list-1',
  created_at: new Date(),
  is_purchased: false,
  purchased_at: null,
  item_count: 2,
  purchased_count: 0,
};

describe('ShoppingService.generate (RF-12)', () => {
  let client: { query: jest.Mock; release: jest.Mock };
  let service: ShoppingService;
  let lowRows: object[];
  let activeRows: object[];
  let insertedListRows: object[];

  const sql = (): string[] =>
    client.query.mock.calls.map(([text]) =>
      (text as string).replace(/\s+/g, ' ').trim(),
    );
  const paramsOf = (fragment: string) =>
    client.query.mock.calls.find(([text]) =>
      (text as string).replace(/\s+/g, ' ').includes(fragment),
    )?.[1] as unknown[];

  beforeEach(() => {
    lowRows = lowStock;
    activeRows = [];
    insertedListRows = [{ id: 'list-new' }];
    client = {
      query: jest.fn((text: string) => {
        const q = text.replace(/\s+/g, ' ');
        if (q.includes('current_stock < min_stock')) {
          return Promise.resolve({ rows: lowRows, rowCount: lowRows.length });
        }
        if (
          q.includes(
            'FROM shopping_lists WHERE user_id = $1 AND NOT is_purchased',
          )
        ) {
          return Promise.resolve({
            rows: activeRows,
            rowCount: activeRows.length,
          });
        }
        if (q.includes('INSERT INTO shopping_lists')) {
          return Promise.resolve({
            rows: insertedListRows,
            rowCount: insertedListRows.length,
          });
        }
        if (q.includes('FROM shopping_lists l WHERE l.id = $1')) {
          return Promise.resolve({ rows: [listRow], rowCount: 1 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      }),
      release: jest.fn(),
    };
    service = new ShoppingService({
      connect: jest.fn().mockResolvedValue(client),
    } as unknown as Pool);
  });

  it('sin lista activa crea una con los faltantes y sus cantidades sugeridas', async () => {
    const result = await service.generate('user-1');

    expect(sql()).toContainEqual(
      expect.stringContaining(
        'ON CONFLICT (user_id) WHERE is_purchased = FALSE DO NOTHING',
      ),
    );
    // RS-02: 500 - 120 = 380; reorder_quantity fijo = 12
    expect(paramsOf('INSERT INTO shopping_list_items')).toEqual([
      'list-new',
      ['prod-1', 'prod-2'],
      [380, 12],
    ]);
    expect(sql().at(-1)).toBe('COMMIT');
    expect(result).toMatchObject({ id: 'list-1' });
  });

  it('con lista activa la sincroniza: depura normalizados y no toca los comprados', async () => {
    activeRows = [{ id: 'list-1' }];

    await service.generate('user-1');

    const statements = sql();
    expect(statements[2]).toContain('FOR UPDATE');
    expect(statements).not.toContainEqual(
      expect.stringContaining('INSERT INTO shopping_lists'),
    );
    expect(paramsOf('product_id <> ALL')).toEqual([
      'list-1',
      ['prod-1', 'prod-2'],
    ]);
    expect(paramsOf('INSERT INTO shopping_list_items')?.[0]).toBe('list-1');
    expect(
      statements.find((s) => s.includes('INSERT INTO shopping_list_items')),
    ).toContain('WHERE NOT shopping_list_items.purchased');
  });

  it('si otra petición creó la lista en paralelo, reutiliza la existente', async () => {
    insertedListRows = [];
    let lookups = 0;
    const base = client.query.getMockImplementation() as (
      text: string,
    ) => Promise<unknown>;
    client.query.mockImplementation((text: string) => {
      if (
        text.replace(/\s+/g, ' ').includes('AND NOT is_purchased FOR UPDATE')
      ) {
        lookups += 1;
        const rows = lookups === 1 ? [] : [{ id: 'list-concurrente' }];
        return Promise.resolve({ rows, rowCount: rows.length });
      }
      return base(text);
    });

    await service.generate('user-1');

    expect(paramsOf('INSERT INTO shopping_list_items')?.[0]).toBe(
      'list-concurrente',
    );
  });

  describe('sin faltantes (LC-06)', () => {
    beforeEach(() => {
      lowRows = [];
    });

    it('no crea lista y responde un array vacío', async () => {
      await expect(service.generate('user-1')).resolves.toEqual([]);
      expect(sql()).not.toContainEqual(
        expect.stringContaining('INSERT INTO shopping_lists'),
      );
    });

    it('depura los pendientes de la activa y la elimina si queda vacía', async () => {
      activeRows = [{ id: 'list-1' }];

      await expect(service.generate('user-1')).resolves.toEqual([]);

      const statements = sql();
      expect(statements).toContainEqual(
        expect.stringContaining(
          'DELETE FROM shopping_list_items WHERE shopping_list_id = $1 AND NOT purchased',
        ),
      );
      expect(statements).toContainEqual(
        expect.stringContaining(
          'DELETE FROM shopping_lists l WHERE l.id = $1 AND NOT EXISTS',
        ),
      );
      expect(statements.at(-1)).toBe('COMMIT');
    });
  });
});
