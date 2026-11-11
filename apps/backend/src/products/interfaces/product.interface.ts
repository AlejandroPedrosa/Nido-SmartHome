import { Unit } from '../../common/enums/unit.enum';
import { getStockStatus, StockStatus } from '../../common/utils/stock-status';
import { getSuggestedQuantity } from '../../common/utils/suggested-quantity';

/** Fila de `products` tal como la devuelve `pg` (NUMERIC ya convertido a number). */
export interface ProductRow {
  id: string;
  name: string;
  category: string | null;
  unit: Unit;
  current_stock: number;
  min_stock: number;
  reorder_quantity: number | null;
  created_at: Date;
}

/** Producto expuesto por la API, con su estado de stock derivado. */
export interface Product extends ProductRow {
  stock_status: StockStatus;
}

/** Producto bajo mínimo con la cantidad sugerida de reposición (RS-02). */
export interface LowStockProduct extends Product {
  suggested_quantity: number;
}

export interface ProductContainer {
  id: string;
  name: string;
}

/** Detalle de un producto con los contenedores donde está asignado (CT-01). */
export interface ProductDetail extends Product {
  containers: ProductContainer[];
}

/** Columnas de `products` que se seleccionan en todas las consultas. */
export const PRODUCT_COLUMNS = `p.id, p.name, p.category, p.unit, p.current_stock,
  p.min_stock, p.reorder_quantity, p.created_at`;

export function toProduct(row: ProductRow): Product {
  return {
    ...row,
    stock_status: getStockStatus(row.current_stock, row.min_stock),
  };
}

export function toLowStockProduct(row: ProductRow): LowStockProduct {
  return {
    ...toProduct(row),
    suggested_quantity: getSuggestedQuantity({
      currentStock: row.current_stock,
      minStock: row.min_stock,
      reorderQuantity: row.reorder_quantity,
    }),
  };
}
