/**
 * Estado derivado del stock de un producto. No se persiste: se calcula al
 * consultar (docs/base-de-datos.md §5, "Estados derivados de stock").
 */
export enum StockStatus {
  /** `current_stock = 0` */
  OutOfStock = 'out_of_stock',
  /** `current_stock > 0 AND current_stock < min_stock` */
  LowStock = 'low_stock',
  /** `current_stock > 0 AND current_stock >= min_stock` */
  Ok = 'ok',
}

/**
 * Regla RS-01: el producto entra en reposición si `current_stock < min_stock`.
 * Es el mismo criterio que usa la lista de compras (LC-01).
 */
export function isLowStock(currentStock: number, minStock: number): boolean {
  return currentStock < minStock;
}

/**
 * Clasifica el stock con condiciones mutuamente excluyentes, evaluadas en
 * orden de precedencia: Sin stock → Bajo mínimo → OK.
 */
export function getStockStatus(
  currentStock: number,
  minStock: number,
): StockStatus {
  if (currentStock <= 0) {
    return StockStatus.OutOfStock;
  }
  if (isLowStock(currentStock, minStock)) {
    return StockStatus.LowStock;
  }
  return StockStatus.Ok;
}
