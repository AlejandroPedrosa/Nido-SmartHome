import { getStockStatus, isLowStock, StockStatus } from './stock-status';

describe('isLowStock (RS-01)', () => {
  it.each([
    [499.99, 500, true],
    [500, 500, false],
    [750, 500, false],
    [0, 0, false],
    [0, 1, true],
  ])('current=%p, min=%p → %p', (current, min, expected) => {
    expect(isLowStock(current, min)).toBe(expected);
  });
});

describe('getStockStatus', () => {
  it('ejemplo del README: Fideos 750 g con mínimo 500 g → OK', () => {
    expect(getStockStatus(750, 500)).toBe(StockStatus.Ok);
  });

  it('stock en 0 es "sin stock" aunque el mínimo sea 0 (prioridad 1)', () => {
    expect(getStockStatus(0, 0)).toBe(StockStatus.OutOfStock);
    expect(getStockStatus(0, 500)).toBe(StockStatus.OutOfStock);
  });

  it('stock positivo por debajo del mínimo es "bajo mínimo" (prioridad 2)', () => {
    expect(getStockStatus(250, 500)).toBe(StockStatus.LowStock);
    expect(getStockStatus(0.01, 0.02)).toBe(StockStatus.LowStock);
  });

  it('stock igual al mínimo es OK (prioridad 3)', () => {
    expect(getStockStatus(500, 500)).toBe(StockStatus.Ok);
  });

  it('serializa con valores estables para el frontend', () => {
    expect(Object.values(StockStatus)).toEqual([
      'out_of_stock',
      'low_stock',
      'ok',
    ]);
  });
});
