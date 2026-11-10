import { getSuggestedQuantity, roundQuantity } from './suggested-quantity';

describe('roundQuantity', () => {
  it.each([
    [0.3 - 0.1, 0.2],
    [1.005, 1.01],
    [750, 750],
    [2.344, 2.34],
  ])('%p → %p', (value, expected) => {
    expect(roundQuantity(value)).toBe(expected);
  });
});

describe('getSuggestedQuantity (RS-02 / LC-02)', () => {
  it('usa reorder_quantity cuando está definido', () => {
    expect(
      getSuggestedQuantity({
        currentStock: 100,
        minStock: 500,
        reorderQuantity: 1000,
      }),
    ).toBe(1000);
  });

  it('sugiere min_stock - current_stock si no hay reorder_quantity', () => {
    expect(
      getSuggestedQuantity({
        currentStock: 120,
        minStock: 500,
        reorderQuantity: null,
      }),
    ).toBe(380);
  });

  it('redondea la diferencia a 2 decimales', () => {
    expect(
      getSuggestedQuantity({
        currentStock: 0.1,
        minStock: 0.3,
        reorderQuantity: null,
      }),
    ).toBe(0.2);
  });

  it('nunca sugiere una cantidad negativa', () => {
    expect(
      getSuggestedQuantity({
        currentStock: 800,
        minStock: 500,
        reorderQuantity: null,
      }),
    ).toBe(0);
  });

  it('ignora un reorder_quantity no positivo y usa la diferencia', () => {
    expect(
      getSuggestedQuantity({
        currentStock: 1,
        minStock: 3,
        reorderQuantity: 0,
      }),
    ).toBe(2);
  });
});
