import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type {
  AvailableRecipe,
  CookResult,
  CreateRecipePayload,
  RecipeDetail,
  RecipeSummary,
  UpdateRecipePayload,
} from '@/types';

export const recipesService = {
  list(): Promise<RecipeSummary[]> {
    return apiGet<RecipeSummary[]>('/recipes');
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
