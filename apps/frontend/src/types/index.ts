/** Tipos alineados con las interfaces del backend (snake_case). */

export type ProductUnit = 'g' | 'kg' | 'ml' | 'l' | 'unidad' | 'paquete' | 'botella';

export type StockStatus = 'out_of_stock' | 'low_stock' | 'ok';

export type MovementType = 'manual' | 'recipe_consumption' | 'shopping';

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number | null;
  user: AuthUser;
}

export interface RegisterResponse {
  user: AuthUser;
  session: AuthSession | null;
  email_confirmation_required: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string | null;
  unit: ProductUnit;
  current_stock: number;
  min_stock: number;
  reorder_quantity: number | null;
  created_at: string;
  stock_status: StockStatus;
}

export interface ProductContainer {
  id: string;
  name: string;
}

/** Producto con sus contenedores (GET /products y GET /products/:id, PR-01). */
export interface ProductDetail extends Product {
  containers: ProductContainer[];
}

export interface LowStockProduct extends Product {
  suggested_quantity: number;
}

export interface CreateProductPayload {
  name: string;
  category?: string | null;
  unit?: ProductUnit;
  current_stock?: number;
  min_stock?: number;
  reorder_quantity?: number | null;
  /** Contenedores asignados, en la misma transacción que el alta (CT-01). */
  container_ids?: string[];
}

export interface UpdateProductPayload {
  name?: string;
  category?: string | null;
  unit?: ProductUnit;
  min_stock?: number;
  reorder_quantity?: number | null;
  /** Reemplaza los contenedores asignados (`[]` desvincula todos). */
  container_ids?: string[];
}

export interface ProductQuery {
  name?: string;
  category?: string;
  low_stock?: boolean;
  container_id?: string;
}

export interface Container {
  id: string;
  name: string;
  created_at: string;
  product_count: number;
}

export interface ContainerDetail extends Container {
  products: Product[];
}

export interface RecipeSummary {
  id: string;
  name: string;
  servings: number;
  created_at: string;
  ingredient_count: number;
}

export interface AvailableRecipe extends RecipeSummary {
  times_available: number;
}

export interface RecipeIngredient {
  product_id: string;
  product_name: string;
  unit: ProductUnit;
  quantity: number;
  current_stock: number;
  available: boolean;
}

export interface RecipeDetail {
  id: string;
  name: string;
  instructions: string | null;
  servings: number;
  created_at: string;
  ingredients: RecipeIngredient[];
  can_cook: boolean;
}

export interface RecipeIngredientPayload {
  product_id: string;
  quantity: number;
}

export interface CreateRecipePayload {
  name: string;
  instructions?: string | null;
  servings?: number;
  ingredients: RecipeIngredientPayload[];
}

export interface UpdateRecipePayload {
  name?: string;
  instructions?: string | null;
  servings?: number;
  ingredients?: RecipeIngredientPayload[];
}

export interface ConsumedIngredient {
  product_id: string;
  product_name: string;
  unit: ProductUnit;
  quantity: number;
  current_stock: number;
}

export interface CookResult {
  recipe_id: string;
  recipe_name: string;
  consumed: ConsumedIngredient[];
}

export interface MissingIngredient {
  product_id: string;
  product_name: string;
  unit: ProductUnit;
  required: number;
  available: number;
}

export interface ShoppingListSummary {
  id: string;
  created_at: string;
  is_purchased: boolean;
  purchased_at: string | null;
  item_count: number;
  purchased_count: number;
}

export interface ShoppingListItem {
  product_id: string;
  product_name: string;
  unit: ProductUnit;
  suggested_quantity: number;
  purchased: boolean;
  current_stock: number;
  min_stock: number;
}

export interface ShoppingListDetail extends ShoppingListSummary {
  items: ShoppingListItem[];
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  quantity_change: number;
  type: MovementType;
  reason: string | null;
  created_at: string;
}

export interface MovementHistoryItem extends InventoryMovement {
  product_name: string;
  unit: string;
}

export interface AdjustStockPayload {
  product_id: string;
  quantity_change: number;
  reason?: string;
}

export interface MovementQuery {
  product_id?: string;
  type?: MovementType;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface NestErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  missing?: MissingIngredient[];
}
