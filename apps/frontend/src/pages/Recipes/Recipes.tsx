import { useState, type FC } from 'react';
import {
    AlertCircle,
    Bookmark,
    CheckCircle2,
    ChefHat,
    ChevronDown,
    Clock,
    Eye,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    Trash2,
    Users,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MOCK_PRODUCTS, type ProductMock } from '@/mocks/inventory';
import { getIngredientStatuses, MOCK_RECIPES, type RecipeMock } from '@/mocks/recipes';
import { CookConfirm } from '@/pages/Recipes/CookConfirm';
import { RecipeDetail } from '@/pages/Recipes/RecipeDetail';
import { RecipeForm, type RecipeFormValues } from '@/pages/Recipes/RecipeForm';

type ActiveModal =
    | { kind: 'create' }
    | { kind: 'edit'; recipeId: string }
    | { kind: 'detail'; recipeId: string }
    | { kind: 'cook'; recipeId: string }
    | { kind: 'delete'; recipeId: string }
    | null;

export const Recipes: FC = () => {
    const [recipes, setRecipes] = useState<RecipeMock[]>(MOCK_RECIPES);
    const [products, setProducts] = useState<ProductMock[]>(MOCK_PRODUCTS);
    const [search, setSearch] = useState('');
    const [filterMode, setFilterMode] = useState<'all' | 'ready'>('all');
    const [maxTime, setMaxTime] = useState<number | null>(null);
    const [savedIds, setSavedIds] = useState<string[]>([]);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [modal, setModal] = useState<ActiveModal>(null);
    const [cookError, setCookError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const statusesOf = (recipe: RecipeMock) => getIngredientStatuses(recipe, products);
    const isReady = (recipe: RecipeMock) => {
        const statuses = statusesOf(recipe);
        return statuses.length > 0 && statuses.every((s) => s.available);
    };

    const readyCount = recipes.filter(isReady).length;

    const filteredRecipes = recipes.filter((recipe) => {
        const matchesSearch = recipe.name.toLowerCase().includes(search.trim().toLowerCase());
        const matchesReady = filterMode === 'all' || isReady(recipe);
        const matchesTime = maxTime === null || (recipe.prepTime !== undefined && recipe.prepTime <= maxTime);
        return matchesSearch && matchesReady && matchesTime;
    });

    const modalRecipe =
        modal && modal.kind !== 'create' ? recipes.find((r) => r.id === modal.recipeId) : undefined;

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 3500);
    };

    const toggleSave = (id: string) => {
        setSavedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    const openFromMenu = (next: NonNullable<ActiveModal>) => {
        setOpenMenuId(null);
        setCookError(null);
        setModal(next);
    };

    const handleCreate = (values: RecipeFormValues) => {
        setRecipes((prev) => [{ id: String(Date.now()), ...values }, ...prev]);
        setModal(null);
        showToast(`Receta "${values.name}" creada.`);
    };

    const handleEdit = (recipeId: string, values: RecipeFormValues) => {
        setRecipes((prev) => prev.map((r) => (r.id === recipeId ? { ...r, ...values } : r)));
        setModal(null);
        showToast('Cambios guardados.');
    };

    const handleDelete = (recipe: RecipeMock) => {
        setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
        setModal(null);
        showToast(`Receta "${recipe.name}" eliminada junto con sus ingredientes.`);
    };

    const handleCook = (recipe: RecipeMock) => {
        const statuses = statusesOf(recipe);
        const missing = statuses.filter((s) => !s.available);
        if (missing.length > 0) {
            setCookError(
                `Stock insuficiente (HTTP 400): ${missing
                    .map((m) => `${m.product.name} (necesita ${m.required} ${m.product.unit}, hay ${m.product.currentStock})`)
                    .join(', ')}. No se descontó nada.`,
            );
            return;
        }

        setProducts((prev) =>
            prev.map((product) => {
                const used = statuses.find((s) => s.product.id === product.id);
                return used
                    ? { ...product, currentStock: Number((product.currentStock - used.required).toFixed(3)) }
                    : product;
            }),
        );
        setCookError(null);
        setModal(null);
        showToast(`¡Listo! "${recipe.name}" cocinada y stock actualizado.`);
    };

    return (
        <div className="flex min-h-screen flex-col">
            {/* Topbar superior */}
            <header className="flex flex-col justify-between gap-4 border-b border-nido-border bg-nido-surface px-6 py-4 sm:flex-row sm:items-center lg:px-8">
                <div>
                    <h1 className="text-base font-bold text-nido-ink">Recetas</h1>
                    <p className="text-xs text-nido-subtle">
                        {recipes.length} {recipes.length === 1 ? 'receta guardada' : 'recetas guardadas'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Buscador */}
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

                    {/* Filtro Tiempo */}
                    <div className="relative">
                        <select
                            value={maxTime ?? ''}
                            onChange={(e) => setMaxTime(e.target.value ? Number(e.target.value) : null)}
                            aria-label="Filtrar por tiempo de preparación"
                            className="cursor-pointer appearance-none rounded-xl border border-nido-border bg-nido-surface py-2 pr-8 pl-3.5 text-xs font-medium text-nido-ink focus:border-nido-olive focus:outline-none"
                        >
                            <option value="">Tiempo</option>
                            <option value="20">Hasta 20 min</option>
                            <option value="30">Hasta 30 min</option>
                            <option value="45">Hasta 45 min</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-3.5 w-3.5 -translate-y-1/2 text-nido-muted" />
                    </div>

                    {/* Botón Nueva Receta */}
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

            {/* Cuerpo */}
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

                {/* Encabezado de sección + Segmented Control */}
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

                {/* Barra de estado */}
                <div className="flex items-center justify-between text-[11px] text-nido-subtle">
                    <span>
                        Mostrando {filteredRecipes.length} de {recipes.length} recetas
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-nido-sage-text" />
                        Disponibilidad calculada con el stock actual
                    </span>
                </div>

                {/* Estado vacío */}
                {filteredRecipes.length === 0 && (
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
                )}

                {/* Grilla de Tarjetas de Recetas */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredRecipes.map((recipe) => {
                        const statuses = statusesOf(recipe);
                        const availableCount = statuses.filter((s) => s.available).length;
                        const totalCount = statuses.length;
                        const ready = isReady(recipe);
                        const missingCount = totalCount - availableCount;
                        const isSaved = savedIds.includes(recipe.id);
                        const isMenuOpen = openMenuId === recipe.id;

                        return (
                            <article
                                key={recipe.id}
                                className="flex flex-col rounded-2xl border border-nido-border bg-nido-surface shadow-[0_2px_10px_rgba(30,34,29,0.02)] transition-shadow hover:shadow-[0_8px_24px_rgba(30,34,29,0.06)]"
                            >
                                {/* Imagen con pill de categoría */}
                                <div className="relative h-44 overflow-hidden rounded-t-2xl bg-nido-card-alt">
                                    {recipe.image ? (
                                        <img src={recipe.image} alt={recipe.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-nido-olive-soft text-nido-olive">
                                            <ChefHat className="h-10 w-10" strokeWidth={1.4} />
                                        </div>
                                    )}
                                    {recipe.category && (
                                        <span className="absolute top-3 left-3 rounded-full bg-nido-surface/95 px-2.5 py-1 text-[11px] font-semibold text-nido-ink shadow-xs backdrop-blur-xs">
                                            {recipe.category}
                                        </span>
                                    )}
                                </div>

                                {/* Contenido Card */}
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

                                        {/* Tiempo y porciones */}
                                        <div className="mt-2 flex items-center gap-4 text-xs text-nido-muted">
                                            {recipe.prepTime !== undefined && (
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-nido-subtle" />
                                                    {recipe.prepTime} min
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1.5">
                                                <Users className="h-3.5 w-3.5 text-nido-subtle" />
                                                {recipe.servings} porciones
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {/* Indicador de ingredientes: stock actual vs. requerido */}
                                        <ul className="space-y-1.5">
                                            {statuses.map(({ product, required, available }) => (
                                                <li
                                                    key={product.id}
                                                    className="flex items-center justify-between gap-2 text-[11px]"
                                                >
                                                    <span className="inline-flex items-center gap-1.5 text-nido-secondary">
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${
                                                                available ? 'bg-nido-sage-text' : 'bg-nido-terracotta-text'
                                                            }`}
                                                        />
                                                        {product.name}
                                                    </span>
                                                    <span
                                                        className={`font-semibold ${
                                                            available ? 'text-nido-sage-text' : 'text-nido-terracotta-text'
                                                        }`}
                                                    >
                                                        {product.currentStock} / {required} {product.unit}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Pill de disponibilidad */}
                                        {ready ? (
                                            <div className="flex items-center justify-between rounded-xl bg-nido-sage-bg px-3 py-2 text-xs font-medium text-nido-sage-text">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    {availableCount}/{totalCount} disponibles
                                                </span>
                                                <span className="h-1.5 w-1.5 rounded-full bg-nido-sage-text" />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between rounded-xl bg-nido-terracotta-bg px-3 py-2 text-xs font-medium text-nido-terracotta-text">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <AlertCircle className="h-3.5 w-3.5" />
                                                    {availableCount}/{totalCount} disponibles · faltan {missingCount}
                                                </span>
                                                <span className="h-1.5 w-1.5 rounded-full bg-nido-terracotta-text" />
                                            </div>
                                        )}

                                        {/* Botón Cocinar receta */}
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
            </div>

            {/* Modales */}
            {modal?.kind === 'create' && (
                <RecipeForm
                    products={products}
                    existingNames={recipes.map((r) => r.name)}
                    onSubmit={handleCreate}
                    onClose={() => setModal(null)}
                />
            )}

            {modal?.kind === 'edit' && modalRecipe && (
                <RecipeForm
                    recipe={modalRecipe}
                    products={products}
                    existingNames={recipes.map((r) => r.name)}
                    onSubmit={(values) => handleEdit(modalRecipe.id, values)}
                    onClose={() => setModal(null)}
                />
            )}

            {modal?.kind === 'detail' && modalRecipe && (
                <RecipeDetail
                    recipe={modalRecipe}
                    ingredients={statusesOf(modalRecipe)}
                    onCook={() => openFromMenu({ kind: 'cook', recipeId: modalRecipe.id })}
                    onClose={() => setModal(null)}
                />
            )}

            {modal?.kind === 'cook' && modalRecipe && (
                <CookConfirm
                    recipe={modalRecipe}
                    ingredients={statusesOf(modalRecipe)}
                    error={cookError}
                    onConfirm={() => handleCook(modalRecipe)}
                    onClose={() => setModal(null)}
                />
            )}

            {modal?.kind === 'delete' && modalRecipe && (
                <ConfirmDialog
                    title="Eliminar receta"
                    tone="danger"
                    confirmLabel="Eliminar receta"
                    description={
                        <>
                            Vas a eliminar <strong>{modalRecipe.name}</strong> y todos sus ingredientes. Los productos
                            del inventario no se modifican.
                        </>
                    }
                    onConfirm={() => handleDelete(modalRecipe)}
                    onCancel={() => setModal(null)}
                />
            )}
        </div>
    );
};
