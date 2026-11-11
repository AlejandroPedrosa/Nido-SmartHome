import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { MovementType } from './interfaces/movement.interface';

describe('InventoryController', () => {
  const applyMovement = jest.fn();
  const controller = new InventoryController({
    applyMovement,
  } as unknown as InventoryService);

  beforeEach(() => jest.clearAllMocks());

  it('adjust registra un movimiento manual con el user_id del token', async () => {
    const result = { movement: { id: 'mov-1' }, current_stock: 900 };
    applyMovement.mockResolvedValue(result);

    await expect(
      controller.adjust('user-1', {
        product_id: 'prod-1',
        quantity_change: 150,
        reason: 'Compra en el almacén',
      }),
    ).resolves.toBe(result);

    expect(applyMovement).toHaveBeenCalledWith({
      userId: 'user-1',
      productId: 'prod-1',
      quantityChange: 150,
      type: MovementType.Manual,
      reason: 'Compra en el almacén',
    });
  });
});
