/** Tipos de movimiento de inventario (regla AU-02). */
export enum MovementType {
  Manual = 'manual',
  RecipeConsumption = 'recipe_consumption',
  Shopping = 'shopping',
}

/** Registro de auditoría inmutable de `inventory_movements` (AU-03). */
export interface InventoryMovement {
  id: string;
  product_id: string;
  /** Con signo: positivo = entrada, negativo = salida. */
  quantity_change: number;
  type: MovementType;
  reason: string | null;
  created_at: Date;
}

export interface ApplyMovementInput {
  /** Dueño del producto, tomado del JWT (MT-02). */
  userId: string;
  productId: string;
  quantityChange: number;
  type: MovementType;
  reason?: string | null;
}

export interface ApplyMovementResult {
  movement: InventoryMovement;
  /** Stock del producto después del movimiento. */
  current_stock: number;
}
