/**
 * Redondea una cantidad a 2 decimales, la precisión de DECIMAL(10, 2).
 * Evita arrastrar errores de punto flotante (p. ej. 0.3 - 0.1 = 0.19999…).
 */
export function roundQuantity(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface ReorderInput {
  currentStock: number;
  minStock: number;
  reorderQuantity: number | null;
}

/**
 * Regla RS-02 (y LC-02): cantidad sugerida de reposición.
 * - Si el producto define `reorder_quantity`, se usa ese valor fijo.
 * - Si no, se sugiere lo que falta para llegar al mínimo:
 *   `min_stock - current_stock`.
 *
 * Nunca devuelve un valor negativo: si el stock ya cubre el mínimo y no hay
 * cantidad fija, la sugerencia es 0 (el producto no necesita reposición).
 */
export function getSuggestedQuantity({
  currentStock,
  minStock,
  reorderQuantity,
}: ReorderInput): number {
  if (reorderQuantity !== null && reorderQuantity > 0) {
    return roundQuantity(reorderQuantity);
  }
  return roundQuantity(Math.max(0, minStock - currentStock));
}
