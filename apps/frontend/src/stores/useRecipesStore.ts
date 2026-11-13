import { create } from 'zustand';
import { ApiError } from '@/lib/api';
import { recipesService } from '@/services/recipes';
import type {
  AvailableRecipe,
  CookResult,
  CreateRecipePayload,
  RecipeDetail,
  RecipeListItem,
  UpdateRecipePayload,
} from '@/types';

interface RecipesState {
  /** Listado con ingredientes y `can_cook` (RC-UI-03). */
  recipes: RecipeListItem[];
  available: AvailableRecipe[];
  selected: RecipeDetail | null;
  isLoading: boolean;
  error: string | null;
  fetchRecipes: () => Promise<void>;
  fetchAvailable: () => Promise<void>;
  fetchDetail: (id: string) => Promise<RecipeDetail>;
  create: (payload: CreateRecipePayload) => Promise<RecipeDetail>;
  update: (id: string, payload: UpdateRecipePayload) => Promise<RecipeDetail>;
  remove: (id: string) => Promise<void>;
  cook: (id: string) => Promise<CookResult>;
}

export const useRecipesStore = create<RecipesState>((set, get) => ({
  recipes: [],
  available: [],
  selected: null,
  isLoading: false,
  error: null,

  fetchRecipes: async () => {
    set({ isLoading: true, error: null });
    try {
      const recipes = await recipesService.list();
      set({ recipes, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof ApiError ? error.message : 'No se pudieron cargar las recetas',
      });
    }
  },

  fetchAvailable: async () => {
    const available = await recipesService.available();
    set({ available });
  },

  fetchDetail: async (id) => {
    const selected = await recipesService.getById(id);
    set({ selected });
    return selected;
  },

  create: async (payload) => {
    const recipe = await recipesService.create(payload);
    await get().fetchRecipes();
    await get().fetchAvailable();
    return recipe;
  },

  update: async (id, payload) => {
    const recipe = await recipesService.update(id, payload);
    await get().fetchRecipes();
    await get().fetchAvailable();
    return recipe;
  },

  remove: async (id) => {
    await recipesService.remove(id);
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
      available: state.available.filter((r) => r.id !== id),
      selected: state.selected?.id === id ? null : state.selected,
    }));
  },

  cook: async (id) => {
    const result = await recipesService.cook(id);
    await get().fetchAvailable();
    if (get().selected?.id === id) {
      await get().fetchDetail(id);
    }
    return result;
  },
}));
