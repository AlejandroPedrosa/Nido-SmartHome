export type ProductUnit = 'g' | 'kg' | 'ml' | 'l' | 'unidad' | 'paquete' | 'botella';

export type MovementType = 'manual' | 'recipe_consumption' | 'shopping';

export interface Product {
    id: string;
    name: string;
    category: string;
    unit: ProductUnit;
    current_stock: number;
    min_stock: number;
    reorder_quantity?: number | null;
    containers: string[];
}

export interface Container {
    id: string;
    name: string;
    product_count: number;
}

export interface RecipeIngredient {
    product_id: string;
    product_name: string;
    quantity: number;
    unit: ProductUnit;
    current_stock: number;
}

export interface Recipe {
    id: string;
    name: string;
    instructions: string;
    servings: number;
    ingredients: RecipeIngredient[];
}

export interface ShoppingListItem {
    product_id: string;
    product_name: string;
    suggested_quantity: number;
    unit: ProductUnit;
    purchased: boolean;
}

export interface InventoryMovement {
    id: string;
    product_id: string;
    product_name: string;
    quantity_change: number;
    type: MovementType;
    reason?: string;
    created_at: string;
}