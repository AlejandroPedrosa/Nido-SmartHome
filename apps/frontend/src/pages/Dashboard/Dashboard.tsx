import { useEffect, useState, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChefHat,
  Package,
  PackageCheck,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import { ActiveShoppingListCard } from '@/pages/Dashboard/ActiveShoppingListCard';
import { productsService } from '@/services/products';
import { containersService } from '@/services/containers';
import { inventoryService } from '@/services/inventory';
import { recipesService } from '@/services/recipes';
import { useShoppingStore } from '@/stores/useShoppingStore';
import type { AvailableRecipe, Container, LowStockProduct, MovementHistoryItem, Product } from '@/types';

export const Dashboard: FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [lowStock, setLowStock] = useState<LowStockProduct[]>([]);
  const [available, setAvailable] = useState<AvailableRecipe[]>([]);
  const [recipeTotal, setRecipeTotal] = useState(0);
  const [movements, setMovements] = useState<MovementHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const activeList = useShoppingStore((s) => s.activeList);
  const loadActive = useShoppingStore((s) => s.loadActive);
  const generate = useShoppingStore((s) => s.generate);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [prods, conts, low, avail, recipes, movs] = await Promise.all([
          productsService.list(),
          containersService.list(),
          productsService.lowStock(),
          recipesService.available(),
          recipesService.list(),
          inventoryService.listMovements({ limit: 5 }),
        ]);
        if (cancelled) return;
        setProducts(prods);
        setContainers(conts);
        setLowStock(low);
        setAvailable(avail);
        setRecipeTotal(recipes.length);
        setMovements(movs);
        await loadActive();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el panel');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadActive]);

  const handleAddToShoppingList = async (productId: string) => {
    await generate();
    setAddedIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
  };

  const shoppingCard =
    activeList && activeList.item_count > 0
      ? { purchasedCount: activeList.purchased_count, totalCount: activeList.item_count }
      : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-col justify-between gap-4 border-b border-nido-border bg-nido-surface px-6 py-4 sm:flex-row sm:items-center lg:px-8">
        <div>
          <h1 className="text-base font-bold text-nido-ink">Panel Principal</h1>
          <p className="text-xs text-nido-subtle">Resumen general del estado de tu hogar</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/shopping-list"
            className="inline-flex items-center gap-1.5 rounded-xl border border-nido-border bg-nido-surface px-3.5 py-2 text-xs font-medium text-nido-ink transition-colors hover:bg-nido-bg"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-nido-secondary" />
            <span>Lista de compras</span>
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-nido-olive-hover"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar producto</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
        {error && (
          <div className="rounded-2xl border border-nido-terracotta-border bg-nido-terracotta-bg px-4 py-3 text-xs text-nido-terracotta-text">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-xs text-nido-muted">Cargando panel...</p>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-nido-border bg-nido-surface p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-nido-muted">Productos en stock</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-nido-olive-soft text-nido-olive">
                    <Package className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-nido-ink">{products.length}</p>
                <p className="mt-1 text-[11px] text-nido-subtle">
                  Distribuidos en {containers.length} contenedores
                </p>
              </div>

              <div className="rounded-2xl border border-nido-border bg-nido-surface p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-nido-muted">Stock bajo / Reponer</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-nido-terracotta-bg text-nido-terracotta-text">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-nido-ink">{lowStock.length}</p>
                <p className="mt-1 text-[11px] font-medium text-nido-terracotta-text">
                  {lowStock.length === 0
                    ? 'Inventario al día'
                    : `${lowStock.length} por debajo del mínimo`}
                </p>
              </div>

              <div className="rounded-2xl border border-nido-border bg-nido-surface p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-nido-muted">Recetas listas</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-nido-sage-bg text-nido-sage-text">
                    <ChefHat className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-nido-ink">{available.length}</p>
                <p className="mt-1 text-[11px] font-medium text-nido-sage-text">
                  De {recipeTotal} recetas guardadas
                </p>
              </div>

              <div className="rounded-2xl border border-nido-border bg-nido-surface p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-nido-muted">Espacios activos</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-nido-olive-soft text-nido-olive">
                    <Archive className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-nido-ink">{containers.length}</p>
                <p className="mt-1 text-[11px] text-nido-subtle">Contenedores del hogar</p>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <section className="rounded-2xl border border-nido-border bg-nido-surface p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-nido-ink">Productos próximos a agotarse</h2>
                      <p className="text-xs text-nido-muted">
                        Insumos por debajo de su stock mínimo configurado
                      </p>
                    </div>
                    <Link
                      to="/products"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-nido-olive hover:underline"
                    >
                      <span>Ver todos</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {lowStock.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <PackageCheck className="h-8 w-8 text-nido-sage-text" />
                      <p className="mt-3 text-sm font-semibold text-nido-ink">Inventario al día</p>
                      <p className="mt-1 text-xs text-nido-muted">
                        Ningún producto está por debajo de su stock mínimo.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-nido-border">
                      {lowStock.slice(0, 6).map((item) => {
                        const isAdded = addedIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            className="flex flex-col justify-between gap-3 py-3.5 first:pt-1 last:pb-1 sm:flex-row sm:items-center"
                          >
                            <div className="flex items-center gap-3">
                              <span className="h-2 w-2 shrink-0 rounded-full bg-nido-terracotta-text" />
                              <div>
                                <p className="text-xs font-semibold text-nido-ink">{item.name}</p>
                                <p className="text-[11px] text-nido-subtle">
                                  Sugerido: {item.suggested_quantity} {item.unit}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-4 sm:justify-end">
                              <span className="rounded-lg bg-nido-terracotta-bg px-2.5 py-1 text-[11px] font-semibold text-nido-terracotta-text">
                                {item.current_stock} / {item.min_stock} {item.unit}
                              </span>
                              <button
                                type="button"
                                onClick={() => void handleAddToShoppingList(item.id)}
                                disabled={isAdded}
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                                  isAdded
                                    ? 'bg-nido-sage-bg text-nido-sage-text'
                                    : 'cursor-pointer border border-nido-border bg-nido-bg text-nido-ink hover:border-nido-olive'
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" />
                                    <span>En lista</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Sumar a lista</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-nido-border bg-nido-surface p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-nido-ink">Listas para cocinar hoy</h2>
                      <p className="text-xs text-nido-muted">
                        Tenés el 100% de los ingredientes disponibles
                      </p>
                    </div>
                    <Link
                      to="/recipes"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-nido-olive hover:underline"
                    >
                      <span>Ir a recetas</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {available.length === 0 ? (
                    <p className="text-xs text-nido-muted">No hay recetas cocinables con el stock actual.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {available.slice(0, 3).map((recipe) => (
                        <div
                          key={recipe.id}
                          className="flex flex-col justify-between rounded-xl border border-nido-border bg-nido-card-alt p-4"
                        >
                          <h3 className="text-xs font-bold text-nido-ink">{recipe.name}</h3>
                          <div className="mt-4 flex items-center justify-between text-[11px] text-nido-muted">
                            <span>{recipe.servings} porciones</span>
                            <span className="inline-flex items-center gap-1 font-medium text-nido-sage-text">
                              <CheckCircle2 className="h-3 w-3" />
                              {recipe.ingredient_count}/{recipe.ingredient_count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="space-y-6">
                <ActiveShoppingListCard list={shoppingCard} />

                <section className="rounded-2xl border border-nido-border bg-nido-surface p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-nido-ink">Espacios del hogar</h2>
                    <Link to="/containers" className="text-xs font-semibold text-nido-olive hover:underline">
                      Gestionar
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {containers.map((container) => (
                      <div key={container.id}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-medium text-nido-ink">{container.name}</span>
                          <span className="text-[11px] text-nido-muted">
                            {container.product_count} productos
                          </span>
                        </div>
                      </div>
                    ))}
                    {containers.length === 0 && (
                      <p className="text-xs text-nido-muted">Todavía no hay contenedores.</p>
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-nido-border bg-nido-surface p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-nido-ink">Movimientos recientes</h2>
                    <ArrowUpDown className="h-4 w-4 text-nido-subtle" />
                  </div>
                  <div className="space-y-3.5">
                    {movements.map((mov) => {
                      const isPositive = mov.quantity_change > 0;
                      return (
                        <div
                          key={mov.id}
                          className="flex items-start justify-between gap-3 border-b border-nido-border pb-3 last:border-none last:pb-0"
                        >
                          <div>
                            <p className="text-xs font-semibold text-nido-ink">{mov.product_name}</p>
                            <p className="text-[11px] text-nido-muted">{mov.reason ?? mov.type}</p>
                            <p className="mt-0.5 text-[10px] text-nido-subtle">
                              {new Date(mov.created_at).toLocaleString('es-AR')}
                            </p>
                          </div>
                          <span
                            className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                              isPositive
                                ? 'bg-nido-sage-bg text-nido-sage-text'
                                : 'bg-nido-terracotta-bg text-nido-terracotta-text'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {mov.quantity_change} {mov.unit}
                          </span>
                        </div>
                      );
                    })}
                    {movements.length === 0 && (
                      <p className="text-xs text-nido-muted">Sin movimientos todavía.</p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
