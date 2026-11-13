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

/** Fila de `products` con sus contenedores (columna `PRODUCT_CONTAINERS_JSON`). */
export interface ProductDetailRow extends ProductRow {
  containers: ProductContainer[];
}

/** Columnas de `products` que se seleccionan en todas las consultas. */
export const PRODUCT_COLUMNS = `p.id, p.name, p.category, p.unit, p.current_stock,
  p.min_stock, p.reorder_quantity, p.created_at`;

/**
 * Contenedores de un producto `p` como array JSON `[{id, name}]`, ordenados
 * por nombre, en la misma consulta (sin N+1). Solo los del dueño del producto.
 */
export const PRODUCT_CONTAINERS_JSON = `COALESCE((
    SELECT json_agg(json_build_object('id', c.id, 'name', c.name)
                    ORDER BY LOWER(c.name))
      FROM product_containers pc
      JOIN containers c ON c.id = pc.container_id
     WHERE pc.product_id = p.id AND c.user_id = p.user_id
  ), '[]'::json) AS containers`;

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

export function toProductDetail(row: ProductDetailRow): ProductDetail {
  return { ...toProduct(row), containers: row.containers };
}
