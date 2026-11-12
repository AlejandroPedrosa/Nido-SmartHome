import { Unit } from '../../common/enums/unit.enum';

/** Receta para el listado (RecipeList). */
export interface RecipeSummary {
  id: string;
  name: string;
  servings: number;
  created_at: Date;
  ingredient_count: number;
}

/** Receta cocinable con el stock actual (RC-04). */
export interface AvailableRecipe extends RecipeSummary {
  /** Cuántas veces se puede preparar con el stock actual (mínimo 1). */
  times_available: number;
}

/** Ingrediente con los datos actuales del producto que consume. */
export interface RecipeIngredient {
  product_id: string;
  product_name: string;
  unit: Unit;
  /** Cantidad que consume la receta, en la unidad del producto. */
  quantity: number;
  current_stock: number;
  /** RC-04: el stock actual cubre la cantidad requerida. */
  available: boolean;
}

/** Detalle de una receta (RecipeDetail). */
export interface RecipeDetail {
  id: string;
  name: string;
  instructions: string | null;
  servings: number;
  created_at: Date;
  ingredients: RecipeIngredient[];
  /** RC-04: todos los ingredientes tienen stock suficiente. */
  can_cook: boolean;
}

/** Columnas de una receta `r` con la cantidad de ingredientes. */
export const RECIPE_SUMMARY_COLUMNS = `r.id, r.name, r.servings, r.created_at,
  (SELECT count(*)::int FROM recipe_ingredients ri
    WHERE ri.recipe_id = r.id) AS ingredient_count`;
