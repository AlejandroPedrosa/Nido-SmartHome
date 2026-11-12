import { useState, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
    AlertTriangle,
    Archive,
    ArrowRight,
    ArrowUpDown,
    Check,
    CheckCircle2,
    ChefHat,
    Clock,
    Package,
    Plus,
    ShoppingBag,
    } from 'lucide-react';

    interface LowStockItem {
    id: string;
    name: string;
    container: string;
    current: number;
    min: number;
    unit: string;
    }

    interface ContainerSummary {
    id: string;
    name: string;
    itemCount: number;
    percentage: number;
    }

    interface RecentMovement {
    id: string;
    product: string;
    delta: string;
    reason: string;
    time: string;
    isPositive: boolean;
    }

    interface ReadyRecipe {
    id: string;
    name: string;
    category: string;
    prepTime: number;
    ingredientsCount: number;
    }

    const LOW_STOCK_ITEMS: LowStockItem[] = [
    { id: '1', name: 'Leche entera', container: 'Heladera', current: 1, min: 3, unit: 'l' },
    { id: '2', name: 'Aceite de oliva', container: 'Alacena', current: 250, min: 500, unit: 'ml' },
    { id: '3', name: 'Huevos de campo', container: 'Heladera', current: 4, min: 12, unit: 'unid.' },
    { id: '4', name: 'Arroz integral', container: 'Alacena', current: 300, min: 1000, unit: 'g' },
    ];

    const CONTAINER_SUMMARIES: ContainerSummary[] = [
    { id: '1', name: 'Alacena', itemCount: 94, percentage: 78 },
    { id: '2', name: 'Heladera', itemCount: 68, percentage: 65 },
    { id: '3', name: 'Freezer', itemCount: 42, percentage: 52 },
    { id: '4', name: 'Lavadero', itemCount: 28, percentage: 45 },
    { id: '5', name: 'Baño', itemCount: 16, percentage: 32 },
    ];

    const RECENT_MOVEMENTS: RecentMovement[] = [
    {
        id: '1',
        product: 'Papas blancas',
        delta: '-600 g',
        reason: 'Receta: Tortilla de patatas',
        time: 'Hoy, 13:15',
        isPositive: false,
    },
    {
        id: '2',
        product: 'Leche entera',
        delta: '+2 l',
        reason: 'Compra semanal',
        time: 'Ayer, 19:40',
        isPositive: true,
    },
    {
        id: '3',
        product: 'Pechuga de pollo',
        delta: '-500 g',
        reason: 'Ajuste manual',
        time: 'Ayer, 12:10',
        isPositive: false,
    },
    ];

    const READY_RECIPES: ReadyRecipe[] = [
    { id: '1', name: 'Tortilla de patatas', category: 'Clásicos', prepTime: 35, ingredientsCount: 5 },
    { id: '2', name: 'Pasta cremosa al limón', category: 'Pasta', prepTime: 25, ingredientsCount: 6 },
    { id: '3', name: 'Tostadas francesas', category: 'Desayuno', prepTime: 15, ingredientsCount: 3 },
    ];

    export const Dashboard: FC = () => {
    const [addedToCartIds, setAddedToCartIds] = useState<string[]>([]);

    const handleAddToShoppingList = (id: string) => {
        setAddedToCartIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    return (
        <div className="flex min-h-screen flex-col">
        {/* Topbar */}
        <header className="flex flex-col justify-between gap-4 border-b border-nido-border bg-nido-surface px-6 py-4 sm:flex-row sm:items-center lg:px-8">
            <div>
            <h1 className="text-base font-bold text-nido-ink">Panel Principal</h1>
            <p className="text-xs text-nido-subtle">
                Resumen general del estado de tu hogar · Casa Av. Siempreviva
            </p>
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

        {/* Contenido Principal */}
        <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
            {/* KPIs superiores */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-nido-border bg-nido-surface p-5">
                <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-nido-muted">Productos en stock</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-nido-olive-soft text-nido-olive">
                    <Package className="h-4 w-4" />
                </div>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-nido-ink">248</p>
                <p className="mt-1 text-[11px] text-nido-subtle">Distribuidos en 6 contenedores</p>
            </div>

            <div className="rounded-2xl border border-nido-border bg-nido-surface p-5">
                <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-nido-muted">Stock bajo / Reponer</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-nido-terracotta-bg text-nido-terracotta-text">
                    <AlertTriangle className="h-4 w-4" />
                </div>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-nido-ink">7</p>
                <p className="mt-1 text-[11px] font-medium text-nido-terracotta-text">
                4 productos por debajo del mínimo
                </p>
            </div>

            <div className="rounded-2xl border border-nido-border bg-nido-surface p-5">
                <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-nido-muted">Recetas listas</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-nido-sage-bg text-nido-sage-text">
                    <ChefHat className="h-4 w-4" />
                </div>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-nido-ink">4</p>
                <p className="mt-1 text-[11px] font-medium text-nido-sage-text">
                De 12 recetas guardadas
                </p>
            </div>

            <div className="rounded-2xl border border-nido-border bg-nido-surface p-5">
                <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-nido-muted">Espacios activos</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-nido-olive-soft text-nido-olive">
                    <Archive className="h-4 w-4" />
                </div>
                </div>
                <p className="mt-3 text-2xl font-bold tracking-tight text-nido-ink">6</p>
                <p className="mt-1 text-[11px] text-nido-subtle">68% capacidad total ocupada</p>
            </div>
            </section>

            {/* Grid de 2 columnas */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Columna izquierda (2/3) */}
            <div className="space-y-6 lg:col-span-2">
                {/* Alertas de reposición */}
                <section className="rounded-2xl border border-nido-border bg-nido-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                    <h2 className="text-sm font-bold text-nido-ink">Productos próximos a agotarse</h2>
                    <p className="text-xs text-nido-muted">
                        Insumos que cayeron por debajo de su stock mínimo configurado
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

                <div className="divide-y divide-nido-border">
                    {LOW_STOCK_ITEMS.map((item) => {
                    const isAdded = addedToCartIds.includes(item.id);
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
                                Ubicación: <span className="font-medium text-nido-secondary">{item.container}</span>
                            </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                            <span className="rounded-lg bg-nido-terracotta-bg px-2.5 py-1 text-[11px] font-semibold text-nido-terracotta-text">
                            {item.current} / {item.min} {item.unit}
                            </span>

                            <button
                            type="button"
                            onClick={() => handleAddToShoppingList(item.id)}
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
                </section>

                {/* Recetas listas para hoy */}
                <section className="rounded-2xl border border-nido-border bg-nido-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                    <h2 className="text-sm font-bold text-nido-ink">Listas para cocinar hoy</h2>
                    <p className="text-xs text-nido-muted">
                        Tenés el 100% de los ingredientes disponibles en casa
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {READY_RECIPES.map((recipe) => (
                    <div
                        key={recipe.id}
                        className="flex flex-col justify-between rounded-xl border border-nido-border bg-nido-card-alt p-4"
                    >
                        <div>
                        <span className="inline-block rounded-full bg-nido-surface px-2.5 py-0.5 text-[10px] font-semibold text-nido-secondary border border-nido-border">
                            {recipe.category}
                        </span>
                        <h3 className="mt-2.5 text-xs font-bold text-nido-ink">{recipe.name}</h3>
                        </div>

                        <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-nido-muted">
                            <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {recipe.prepTime} min
                            </span>
                            <span className="inline-flex items-center gap-1 font-medium text-nido-sage-text">
                            <CheckCircle2 className="h-3 w-3" />
                            {recipe.ingredientsCount}/{recipe.ingredientsCount}
                            </span>
                        </div>
                        </div>
                    </div>
                    ))}
                </div>
                </section>
            </div>

            {/* Columna derecha (1/3) */}
            <div className="space-y-6">
                {/* Distribución por contenedores */}
                <section className="rounded-2xl border border-nido-border bg-nido-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-nido-ink">Espacios del hogar</h2>
                    <Link
                    to="/containers"
                    className="text-xs font-semibold text-nido-olive hover:underline"
                    >
                    Gestionar
                    </Link>
                </div>

                <div className="space-y-4">
                    {CONTAINER_SUMMARIES.map((container) => (
                    <div key={container.id}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-nido-ink">{container.name}</span>
                        <span className="text-[11px] text-nido-muted">
                            {container.itemCount} productos
                        </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-nido-olive-soft">
                        <div
                            className="h-full rounded-full bg-nido-olive"
                            style={{ width: `${container.percentage}%` }}
                        />
                        </div>
                    </div>
                    ))}
                </div>
                </section>

                {/* Actividad reciente */}
                <section className="rounded-2xl border border-nido-border bg-nido-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-nido-ink">Movimientos recientes</h2>
                    <ArrowUpDown className="h-4 w-4 text-nido-subtle" />
                </div>

                <div className="space-y-3.5">
                    {RECENT_MOVEMENTS.map((mov) => (
                    <div
                        key={mov.id}
                        className="flex items-start justify-between gap-3 border-b border-nido-border pb-3 last:border-none last:pb-0"
                    >
                        <div>
                        <p className="text-xs font-semibold text-nido-ink">{mov.product}</p>
                        <p className="text-[11px] text-nido-muted">{mov.reason}</p>
                        <p className="mt-0.5 text-[10px] text-nido-subtle">{mov.time}</p>
                        </div>
                        <span
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                            mov.isPositive
                            ? 'bg-nido-sage-bg text-nido-sage-text'
                            : 'bg-nido-terracotta-bg text-nido-terracotta-text'
                        }`}
                        >
                        {mov.delta}
                        </span>
                    </div>
                    ))}
                </div>
                </section>
            </div>
            </div>
        </div>
        </div>
    );
};