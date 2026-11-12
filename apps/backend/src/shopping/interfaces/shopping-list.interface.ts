import { Unit } from '../../common/enums/unit.enum';

/** Lista de compras para el historial (sin ítems). */
export interface ShoppingListSummary {
  id: string;
  created_at: Date;
  is_purchased: boolean;
  purchased_at: Date | null;
  item_count: number;
  purchased_count: number;
}

/** Ítem de una lista, con el estado actual del producto. */
export interface ShoppingListItem {
  product_id: string;
  product_name: string;
  unit: Unit;
  /** Cantidad a comprar (RS-02 / LC-02), en la unidad del producto. */
  suggested_quantity: number;
  purchased: boolean;
  current_stock: number;
  min_stock: number;
}

/** Lista con sus ítems (ShoppingListView). */
export interface ShoppingListDetail extends ShoppingListSummary {
  items: ShoppingListItem[];
}

/** Columnas de una lista `l` con los conteos de ítems. */
export const LIST_SUMMARY_COLUMNS = `l.id, l.created_at, l.is_purchased, l.purchased_at,
  (SELECT count(*)::int FROM shopping_list_items i
    WHERE i.shopping_list_id = l.id) AS item_count,
  (SELECT count(*)::int FROM shopping_list_items i
    WHERE i.shopping_list_id = l.id AND i.purchased) AS purchased_count`;
