import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { IsQuantity } from './quantity.decorators';

class Sample {
  @IsQuantity('stock', { min: 'zero' })
  stock!: number;

  @IsQuantity('cantidad', { min: 'positive' })
  cantidad!: number;
}

const messages = (payload: Record<string, unknown>) =>
  validateSync(plainToInstance(Sample, payload), {
    stopAtFirstError: true,
  }).flatMap((e) => Object.values(e.constraints ?? {}));

describe('IsQuantity', () => {
  it('acepta 0 en "zero" y exige > 0 en "positive"', () => {
    expect(messages({ stock: 0, cantidad: 0.01 })).toEqual([]);
    expect(messages({ stock: 0, cantidad: 0 })).toEqual([
      'cantidad debe ser mayor a 0',
    ]);
  });

  it('valida primero el tipo: un texto no informa el rango', () => {
    expect(messages({ stock: '-5', cantidad: 1 })).toEqual([
      'stock debe ser un número con hasta 2 decimales',
    ]);
  });
});
