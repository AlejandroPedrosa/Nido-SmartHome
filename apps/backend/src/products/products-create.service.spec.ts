import { Pool, PoolClient } from 'pg';
import { Unit } from '../common/enums/unit.enum';
import { StockStatus } from '../common/utils/stock-status';
import { InventoryService, MovementType } from '../inventory';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';

const insertedRow = {
  id: 'prod-1',
  name: 'Fideos Tallarines',
  category: 'Alimentos',
  unit: Unit.Gram,
  current_stock: 0,
  min_stock: 500,
  reorder_quantity: null,
  created_at: new Date('2026-11-11T12:00:00Z'),
};

const dto = (overrides: Partial<CreateProductDto> = {}): CreateProductDto =>
  Object.assign(new CreateProductDto(), {
    name: 'Fideos Tallarines',
    category: 'Alimentos',
    unit: Unit.Gram,
    current_stock: 750,
    min_stock: 500,
    ...overrides,
  });

describe('ProductsService.create', () => {
  let client: { query: jest.Mock; release: jest.Mock };
  let pool: { connect: jest.Mock };
  let applyMovement: jest.Mock;
  let service: ProductsService;

  beforeEach(() => {
    client = {
      query: jest.fn((sql: string) =>
        Promise.resolve(
          sql.includes('INSERT INTO products')
            ? { rows: [{ ...insertedRow }], rowCount: 1 }
            : { rows: [], rowCount: 0 },
        ),
      ),
      release: jest.fn(),
    };
    pool = { connect: jest.fn().mockResolvedValue(client) };
    applyMovement = jest.fn().mockResolvedValue({
      movement: { id: 'mov-1' },
      current_stock: 750,
    });
    service = new ProductsService(
      pool as unknown as Pool,
      {
        applyMovement,
      } as unknown as InventoryService,
    );
  });

  const insertParams = () =>
    client.query.mock.calls.find(([sql]) =>
      (sql as string).includes('INSERT INTO products'),
    )?.[1] as unknown[];

  it('inserta con stock 0 y carga el inicial con un movimiento en la misma transacción', async () => {
    const result = await service.create('user-1', dto());

    expect(insertParams()).toEqual([
      'user-1',
      'Fideos Tallarines',
      'Alimentos',
      'g',
      500,
      null,
    ]);
    expect(applyMovement).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        productId: 'prod-1',
        quantityChange: 750,
        type: MovementType.Manual,
        reason: 'Stock inicial',
      },
      client as unknown as PoolClient,
    );
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenLastCalledWith('COMMIT');
    expect(result).toMatchObject({
      id: 'prod-1',
      current_stock: 750,
      stock_status: StockStatus.Ok,
    });
  });

  it('sin stock inicial no registra movimiento', async () => {
    const result = await service.create('user-1', dto({ current_stock: 0 }));

    expect(applyMovement).not.toHaveBeenCalled();
    expect(result.stock_status).toBe(StockStatus.OutOfStock);
  });

  it('aplica valores por defecto si llegan null', async () => {
    await service.create(
      'user-1',
      dto({
        category: null,
        unit: null as unknown as Unit,
        min_stock: null as unknown as number,
        current_stock: null as unknown as number,
      }),
    );

    expect(insertParams()).toEqual([
      'user-1',
      'Fideos Tallarines',
      null,
      'unidad',
      0,
      null,
    ]);
    expect(applyMovement).not.toHaveBeenCalled();
  });

  it('hace ROLLBACK si falla el movimiento inicial (no queda el producto)', async () => {
    applyMovement.mockRejectedValue(new Error('fallo de auditoría'));

    await expect(service.create('user-1', dto())).rejects.toThrow(
      'fallo de auditoría',
    );
    expect(client.query).toHaveBeenLastCalledWith('ROLLBACK');
  });
});
