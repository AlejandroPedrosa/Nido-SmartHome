import { useEffect, useMemo, useState, type FC } from 'react';
import {
  AlertCircle,
  Bookmark,
  CheckCircle2,
  ChefHat,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ApiError } from '@/lib/api';
import { CookConfirm } from '@/pages/Recipes/CookConfirm';
import { RecipeDetail } from '@/pages/Recipes/RecipeDetail';
import { RecipeForm, type RecipeFormValues } from '@/pages/Recipes/RecipeForm';
import { useProductsStore } from '@/stores/useProductsStore';
import { useRecipesStore } from '@/stores/useRecipesStore';
import type { MissingIngredient, RecipeSummary } from '@/types';

type ActiveModal =
  | { kind: 'create' }
  | { kind: 'edit'; recipeId: string }
  | { kind: 'detail'; recipeId: string }
  | { kind: 'cook'; recipeId: string }
  | { kind: 'delete'; recipeId: string }
  | null;

export const Recipes: FC = () => {
  const recipes = useRecipesStore((s) => s.recipes);
  const available = useRecipesStore((s) => s.available);
  const selected = useRecipesStore((s) => s.selected);
  const isLoading = useRecipesStore((s) => s.isLoading);
  const storeError = useRecipesStore((s) => s.error);
  const fetchRecipes = useRecipesStore((s) => s.fetchRecipes);
  const fetchAvailable = useRecipesStore((s) => s.fetchAvailable);
  const fetchDetail = useRecipesStore((s) => s.fetchDetail);
  const create = useRecipesStore((s) => s.create);
  const update = useRecipesStore((s) => s.update);
  const remove = useRecipesStore((s) => s.remove);
  const cook = useRecipesStore((s) => s.cook);

  const products = useProductsStore((s) => s.products);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'ready'>('all');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<ActiveModal>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cookError, setCookError] = useState<string | null>(null);
  const [cookMissing, setCookMissing] = useState<MissingIngredient[] | null>(null);
  const [isCooking, setIsCooking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    void fetchRecipes();
    void fetchAvailable();
    void fetchProducts();
  }, [fetchRecipes, fetchAvailable, fetchProducts]);

  const availableIds = useMemo(() => new Set(available.map((r) => r.id)), [available]);
  const availableMeta = useMemo(() => {
    const map = new Map(available.map((r) => [r.id, r]));
    return map;
  }, [available]);

  const readyCount = available.length;

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesReady = filterMode === 'all' || availableIds.has(recipe.id);
    return matchesSearch && matchesReady;
  });

  const modalRecipeSummary =
    modal && modal.kind !== 'create' ? recipes.find((r) => r.id === modal.recipeId) : undefined;

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const toggleSave = (id: string) => {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const openDetail = async (recipeId: string, nextKind: 'detail' | 'cook' | 'edit' = 'detail') => {
    setCookError(null);
    setCookMissing(null);
    setModal({ kind: nextKind, recipeId });
    setDetailLoading(true);
    setActionError(null);
    try {
      await fetchDetail(recipeId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo cargar la receta.');
    } finally {
      setDetailLoading(false);
    }
  };

  const openFromMenu = (next: NonNullable<ActiveModal>) => {
    setOpenMenuId(null);
    setCookError(null);
    setCookMissing(null);
    if (next.kind === 'detail' || next.kind === 'cook' || next.kind === 'edit') {
      void openDetail(next.recipeId, next.kind);
      return;
    }
    setModal(next);
  };

  const handleCreate = async (values: RecipeFormValues) => {
    await create(values);
    setModal(null);
    showToast(`Receta "${values.name}" creada.`);
  };

  const handleEdit = async (recipeId: string, values: RecipeFormValues) => {
    await update(recipeId, values);
    setModal(null);
    showToast('Cambios guardados.');
  };

  const handleDelete = async (recipe: RecipeSummary) => {
    try {
      await remove(recipe.id);
      setModal(null);
      showToast(`Receta "${recipe.name}" eliminada junto con sus ingredientes.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo eliminar la receta.');
    }
  };

  const handleCook = async (recipeId: string) => {
    setIsCooking(true);
    setCookError(null);
    setCookMissing(null);
    try {
      const result = await cook(recipeId);
      setModal(null);
      showToast(`¡Listo! "${result.recipe_name}" cocinada y stock actualizado.`);
      await fetchRecipes();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 400) {
        setCookError(err.message || 'Stock insuficiente. No se descontó nada.');
        setCookMissing(err.missing ?? null);
      } else {
        setCookError(err instanceof Error ? err.message : 'No se pudo cocinar la receta.');
      }
    } finally {
      setIsCooking(false);
    }
  };

  const cardAvailability = (recipe: RecipeSummary) => {
    const ready = availableIds.has(recipe.id);
    const meta = availableMeta.get(recipe.id);
    const totalCount = recipe.ingredient_count;
    // En cards solo ready/missing vía available set (brecha RC-UI-03: sin stock por ingrediente).
    if (ready) {
      return { ready: true, availableCount: totalCount, missingCount: 0, times: meta?.times_available };
    }
    return { ready: false, availableCount: 0, missingCount: totalCount, times: undefined };
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-col justify-between gap-4 border-b border-nido-border bg-nido-surface px-6 py-4 sm:flex-row sm:items-center lg:px-8">
        <div>
          <h1 className="text-base font-bold text-nido-ink">Recetas</h1>
          <p className="text-xs text-nido-subtle">
            {recipes.length} {recipes.length === 1 ? 'receta guardada' : 'recetas guardadas'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-nido-subtle" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar recetas..."
              aria-label="Buscar recetas"
              className="w-full rounded-xl border border-nido-border bg-nido-bg py-2 pr-4 pl-9 text-xs text-nido-ink placeholder:text-nido-subtle focus:border-nido-olive focus:bg-nido-surface focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => openFromMenu({ kind: 'create' })}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-nido-olive-hover"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva receta</span>
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
        {toast && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-2xl border border-nido-sage-text/20 bg-nido-sage-bg px-4 py-3 text-xs font-medium text-nido-sage-text"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {(storeError || actionError) && (
          <div
            role="alert"
            className="rounded-2xl border border-nido-terracotta-border bg-nido-terracotta-bg px-4 py-3 text-xs font-medium text-nido-terracotta-text"
          >
            {actionError ?? storeError}
          </div>
        )}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-nido-ink">¿Qué cocinamos hoy?</h2>
            <p className="mt-0.5 text-xs text-nido-muted">
              Recetas pensadas para aprovechar lo que ya tienes en casa.
            </p>
          </div>

          <div className="inline-flex items-center self-start rounded-xl border border-nido-border bg-nido-surface p-1">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filterMode === 'all' ? 'bg-nido-olive text-white' : 'text-nido-secondary hover:text-nido-ink'
              }`}
            >
              Todas las recetas
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('ready')}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs transition-colors ${
                filterMode === 'ready'
                  ? 'bg-nido-olive font-semibold text-white'
                  : 'font-medium text-nido-secondary hover:text-nido-ink'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-nido-sage-text" />
              <span>Disponibles para cocinar</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                  filterMode === 'ready' ? 'bg-white/20 text-white' : 'bg-nido-olive-soft text-nido-ink'
                }`}
              >
                {readyCount}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-nido-subtle">
          <span>
            Mostrando {filteredRecipes.length} de {recipes.length} recetas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-nido-sage-text" />
            Disponibilidad según recetas disponibles del inventario
          </span>
        </div>

        {isLoading && recipes.length === 0 ? (
          <p className="py-16 text-center text-xs text-nido-subtle">Cargando recetas…</p>
        ) : filteredRecipes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-nido-border-strong bg-nido-surface px-6 py-16 text-center">
            <ChefHat className="mx-auto h-8 w-8 text-nido-subtle" />
            <p className="mt-3 text-sm font-semibold text-nido-ink">
              {recipes.length === 0 ? 'Todavía no tenés recetas' : 'No hay recetas para mostrar'}
            </p>
            <p className="mt-1 text-xs text-nido-muted">
              {recipes.length === 0
                ? 'Creá tu primera receta con ingredientes de tu inventario.'
                : filterMode === 'ready'
                  ? 'Ninguna receta se puede cocinar con el stock actual. Revisá tu lista de compras.'
                  : 'Probá cambiando la búsqueda o los filtros.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredRecipes.map((recipe) => {
              const { ready, availableCount, missingCount, times } = cardAvailability(recipe);
              const totalCount = recipe.ingredient_count;
              const isSaved = savedIds.includes(recipe.id);
              const isMenuOpen = openMenuId === recipe.id;

              return (
                <article
                  key={recipe.id}
                  className="flex flex-col rounded-2xl border border-nido-border bg-nido-surface shadow-[0_2px_10px_rgba(30,34,29,0.02)] transition-shadow hover:shadow-[0_8px_24px_rgba(30,34,29,0.06)]"
                >
                  <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-t-2xl bg-nido-olive-soft text-nido-olive">
                    <ChefHat className="h-10 w-10" strokeWidth={1.4} />
                  </div>

                  <div className="flex flex-1 flex-col justify-between space-y-4 p-5">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[15px] leading-snug font-bold text-nido-ink">
                          <button
                            type="button"
                            onClick={() => openFromMenu({ kind: 'detail', recipeId: recipe.id })}
                            className="cursor-pointer text-left hover:underline"
                          >
                            {recipe.name}
                          </button>
                        </h3>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleSave(recipe.id)}
                            aria-pressed={isSaved}
                            className="cursor-pointer rounded-lg border border-nido-border p-1.5 text-nido-muted transition-colors hover:bg-nido-bg hover:text-nido-ink"
                            aria-label="Guardar receta"
                            title="Marcador local (no se sincroniza)"
                          >
                            <Bookmark
                              className={`h-3.5 w-3.5 ${isSaved ? 'fill-nido-olive text-nido-olive' : ''}`}
                            />
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setOpenMenuId(isMenuOpen ? null : recipe.id)}
                              aria-label={`Acciones para ${recipe.name}`}
                              aria-expanded={isMenuOpen}
                              className="cursor-pointer rounded-lg border border-nido-border p-1.5 text-nido-muted transition-colors hover:bg-nido-bg hover:text-nido-ink"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>

                            {isMenuOpen && (
                              <>
                                <button
                                  type="button"
                                  aria-label="Cerrar menú"
                                  onClick={() => setOpenMenuId(null)}
                                  className="fixed inset-0 z-10 cursor-default"
                                />
                                <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-nido-border bg-nido-surface py-1 shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => openFromMenu({ kind: 'detail', recipeId: recipe.id })}
                                    className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-xs text-nido-ink hover:bg-nido-bg"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-nido-secondary" />
                                    Ver detalle
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openFromMenu({ kind: 'edit', recipeId: recipe.id })}
                                    className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-xs text-nido-ink hover:bg-nido-bg"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-nido-secondary" />
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openFromMenu({ kind: 'delete', recipeId: recipe.id })}
                                    className="flex w-full cursor-pointer items-center gap-2 border-t border-nido-border px-3.5 py-2 text-xs text-nido-terracotta-text hover:bg-nido-terracotta-bg"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Eliminar
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-xs text-nido-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-nido-subtle" />
                          {recipe.servings} porciones
                        </span>
                        <span className="text-nido-subtle">
                          {totalCount} {totalCount === 1 ? 'ingrediente' : 'ingredientes'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {ready ? (
                        <div className="flex items-center justify-between rounded-xl bg-nido-sage-bg px-3 py-2 text-xs font-medium text-nido-sage-text">
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Lista para cocinar
                            {times != null && times > 1 ? ` · ×${times}` : ''}
                          </span>
                          <span className="h-1.5 w-1.5 rounded-full bg-nido-sage-text" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-xl bg-nido-terracotta-bg px-3 py-2 text-xs font-medium text-nido-terracotta-text">
                          <span className="inline-flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {availableCount}/{totalCount} disponibles
                            {missingCount > 0 ? ` · faltan insumos` : ''}
                          </span>
                          <span className="h-1.5 w-1.5 rounded-full bg-nido-terracotta-text" />
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={!ready}
                        onClick={() => openFromMenu({ kind: 'cook', recipeId: recipe.id })}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-colors ${
                          ready
                            ? 'cursor-pointer bg-nido-olive text-white hover:bg-nido-olive-hover'
                            : 'cursor-not-allowed border border-nido-border bg-nido-bg text-nido-subtle'
                        }`}
                      >
                        <ChefHat className="h-4 w-4" />
                        <span>Cocinar receta</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {modal?.kind === 'create' && (
        <RecipeForm products={products} onSubmit={handleCreate} onClose={() => setModal(null)} />
      )}

      {modal?.kind === 'edit' && modalRecipeSummary && selected?.id === modalRecipeSummary.id && (
        <RecipeForm
          recipe={selected}
          products={products}
          onSubmit={(values) => handleEdit(modalRecipeSummary.id, values)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.kind === 'detail' && selected?.id === modal.recipeId && (
        <RecipeDetail
          recipe={selected}
          isLoading={detailLoading}
          onCook={() => openFromMenu({ kind: 'cook', recipeId: selected.id })}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.kind === 'cook' && selected?.id === modal.recipeId && (
        <CookConfirm
          recipe={selected}
          ingredients={selected.ingredients}
          error={cookError}
          missing={cookMissing}
          isConfirming={isCooking}
          onConfirm={() => void handleCook(selected.id)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.kind === 'delete' && modalRecipeSummary && (
        <ConfirmDialog
          title="Eliminar receta"
          tone="danger"
          confirmLabel="Eliminar receta"
          description={
            <>
              Vas a eliminar <strong>{modalRecipeSummary.name}</strong> y todos sus ingredientes. Los
              productos del inventario no se modifican.
            </>
          }
          onConfirm={() => void handleDelete(modalRecipeSummary)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
};
