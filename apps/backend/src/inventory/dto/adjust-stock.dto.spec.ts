import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AdjustStockDto } from './adjust-stock.dto';

const PRODUCT_ID = '3f1c2b9e-8d4a-4f6b-9c2e-1a2b3c4d5e6f';

const firstErrors = (payload: Record<string, unknown>) => {
  const dto = plainToInstance(AdjustStockDto, payload);
  const errors = validateSync(dto, { stopAtFirstError: true });
  return {
    dto,
    messages: errors.flatMap((e) => Object.values(e.constraints ?? {})),
  };
};

describe('AdjustStockDto', () => {
  it('acepta una entrada, una salida y recorta el motivo', () => {
    expect(
      firstErrors({ product_id: PRODUCT_ID, quantity_change: 150 }).messages,
    ).toEqual([]);

    const { dto, messages } = firstErrors({
      product_id: PRODUCT_ID,
      quantity_change: -20.5,
      reason: '  se venció  ',
    });
    expect(messages).toEqual([]);
    expect(dto.reason).toBe('se venció');
  });

  it.each([
    [{ quantity_change: 1 }, 'product_id es obligatorio'],
    [
      { product_id: 'abc', quantity_change: 1 },
      'product_id debe ser un UUID válido',
    ],
    [{ product_id: PRODUCT_ID }, 'quantity_change es obligatorio'],
    [
      { product_id: PRODUCT_ID, quantity_change: 0 },
      'La cantidad no puede ser 0',
    ],
    [
      { product_id: PRODUCT_ID, quantity_change: 1.234 },
      'La cantidad debe ser un número con hasta 2 decimales',
    ],
    [
      { product_id: PRODUCT_ID, quantity_change: '10' },
      'La cantidad debe ser un número con hasta 2 decimales',
    ],
    [
      { product_id: PRODUCT_ID, quantity_change: 100_000_000 },
      'La cantidad es demasiado grande',
    ],
    [
      { product_id: PRODUCT_ID, quantity_change: 1, reason: 'x'.repeat(501) },
      'El motivo no puede superar 500 caracteres',
    ],
  ])('rechaza %j', (payload, message) => {
    expect(firstErrors(payload).messages).toEqual([message]);
  });
});
