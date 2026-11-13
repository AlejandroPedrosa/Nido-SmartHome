import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type {
  AvailableRecipe,
  CookResult,
  CreateRecipePayload,
  RecipeDetail,
  RecipeListItem,
  UpdateRecipePayload,
} from '@/types';

export const recipesService = {
  /** Cada receta incluye sus ingredientes (stock vs. requerido) y `can_cook`. */
  list(): Promise<RecipeListItem[]> {
    return apiGet<RecipeListItem[]>('/recipes');
  },

  available(): Promise<AvailableRecipe[]> {
    return apiGet<AvailableRecipe[]>('/recipes/available');
  },

  getById(id: string): Promise<RecipeDetail> {
    return apiGet<RecipeDetail>(`/recipes/${id}`);
  },

  create(payload: CreateRecipePayload): Promise<RecipeDetail> {
    return apiPost<RecipeDetail>('/recipes', payload);
  },

  update(id: string, payload: UpdateRecipePayload): Promise<RecipeDetail> {
    return apiPatch<RecipeDetail>(`/recipes/${id}`, payload);
  },

  remove(id: string): Promise<void> {
    return apiDelete(`/recipes/${id}`);
  },

  cook(id: string): Promise<CookResult> {
    return apiPost<CookResult>(`/recipes/${id}/cook`);
  },
};
