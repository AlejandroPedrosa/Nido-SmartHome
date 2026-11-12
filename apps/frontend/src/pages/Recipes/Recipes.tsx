import { useState, type FC } from 'react';
import {
    AlertCircle,
    Bookmark,
    CheckCircle2,
    ChefHat,
    ChevronDown,
    Clock,
    Plus,
    Search,
    Users,
} from 'lucide-react';

interface RecipeCardMock {
    id: string;
    name: string;
    category: string;
    prepTime: number;
    servings: number;
    availableCount: number;
    totalCount: number;
    image: string;
}

const MOCK_RECIPES: RecipeCardMock[] = [
    {
    id: '1',
    name: 'Tortilla de patatas',
    category: 'Clásicos',
    prepTime: 35,
    servings: 4,
    availableCount: 5,
    totalCount: 5,
    image:
        'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=800&q=80',
    },
    {
    id: '2',
    name: 'Pasta cremosa al limón',
    category: 'Pasta',
    prepTime: 25,
    servings: 2,
    availableCount: 6,
    totalCount: 6,
    image:
        'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80',
    },
    {
    id: '3',
    name: 'Bowl mediterráneo',
    category: 'Vegetariana',
    prepTime: 20,
    servings: 2,
    availableCount: 7,
    totalCount: 8,
    image:
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    },
    {
    id: '4',
    name: 'Lentejas con verduras',
    category: 'De cuchara',
    prepTime: 45,
    servings: 4,
    availableCount: 8,
    totalCount: 8,
    image:
        'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
    },
    {
    id: '5',
    name: 'Tacos de pollo especiado',
    category: 'Rápidas',
    prepTime: 30,
    servings: 4,
    availableCount: 5,
    totalCount: 7,
    image:
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    },
    {
    id: '6',
    name: 'Tostadas francesas',
    category: 'Desayuno',
    prepTime: 15,
    servings: 2,
    availableCount: 3,
    totalCount: 3,
    image:
        'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=80',
    },
];

export const Recipes: FC = () => {
    const [search, setSearch] = useState('');
    const [filterMode, setFilterMode] = useState<'all' | 'ready'>('all');
    const [maxTime, setMaxTime] = useState<number | null>(null);
    const [savedIds, setSavedIds] = useState<string[]>([]);

    const readyCount = MOCK_RECIPES.filter((r) => r.availableCount === r.totalCount).length;

    const filteredRecipes = MOCK_RECIPES.filter((recipe) => {
        const matchesSearch = recipe.name.toLowerCase().includes(search.toLowerCase());
        const matchesReady = filterMode === 'all' || recipe.availableCount === recipe.totalCount;
        const matchesTime = maxTime === null || recipe.prepTime <= maxTime;
        return matchesSearch && matchesReady && matchesTime;
    });

    const toggleSave = (id: string) => {
        setSavedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
        );
    };

    return (
        <div className="flex min-h-screen flex-col">
        {/* Topbar superior */}
        <header className="flex flex-col justify-between gap-4 border-b border-nido-border bg-nido-surface px-6 py-4 sm:flex-row sm:items-center lg:px-8">
            <div>
            <h1 className="text-base font-bold text-nido-ink">Recetas</h1>
            <p className="text-xs text-nido-subtle">12 recetas guardadas</p>
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
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-nido-olive-hover"
            >
                <Plus className="h-4 w-4" />
                <span>Nueva receta</span>
            </button>
            </div>
        </header>

        {/* Cuerpo */}
        <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
            {/* Encabezado de sección + Segmented Control */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
                <h2 className="text-xl font-bold tracking-tight text-nido-ink">
                ¿Qué cocinamos hoy?
                </h2>
                <p className="mt-0.5 text-xs text-nido-muted">
                Recetas pensadas para aprovechar lo que ya tienes en casa.
                </p>
            </div>

            {/* Toggle Todas / Listas para cocinar */}
            <div className="inline-flex items-center self-start rounded-xl border border-nido-border bg-nido-surface p-1">
                <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    filterMode === 'all'
                    ? 'bg-nido-olive text-white'
                    : 'text-nido-secondary hover:text-nido-ink'
                }`}
                >
                Todas
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
                <span>Listas para cocinar</span>
                <span
                    className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                    filterMode === 'ready'
                        ? 'bg-white/20 text-white'
                        : 'bg-nido-olive-soft text-nido-ink'
                    }`}
                >
                    {readyCount}
                </span>
                </button>
            </div>
            </div>

            {/* Barra de estado inferior */}
            <div className="flex items-center justify-between text-[11px] text-nido-subtle">
            <span>Mostrando {filteredRecipes.length} de 12 recetas</span>
            <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-nido-sage-text" />
                Inventario actualizado hoy, 09:42
            </span>
            </div>

            {/* Grilla de Tarjetas de Recetas */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredRecipes.map((recipe) => {
                const isReady = recipe.availableCount === recipe.totalCount;
                const missingCount = recipe.totalCount - recipe.availableCount;
                const isSaved = savedIds.includes(recipe.id);

                return (
                <article
                    key={recipe.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-nido-border bg-nido-surface shadow-[0_2px_10px_rgba(30,34,29,0.02)] transition-shadow hover:shadow-[0_8px_24px_rgba(30,34,29,0.06)]"
                >
                    {/* Imagen con pill de categoría */}
                    <div className="relative h-44 overflow-hidden bg-nido-card-alt">
                    <img
                        src={recipe.image}
                        alt={recipe.name}
                        className="h-full w-full object-cover"
                    />
                    <span className="absolute top-3 left-3 rounded-full bg-nido-surface/95 px-2.5 py-1 text-[11px] font-semibold text-nido-ink shadow-xs backdrop-blur-xs">
                        {recipe.category}
                    </span>
                    </div>

                    {/* Contenido Card */}
                    <div className="flex flex-1 flex-col justify-between space-y-4 p-5">
                    <div>
                        <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[15px] leading-snug font-bold text-nido-ink">
                            {recipe.name}
                        </h3>
                        <button
                            type="button"
                            onClick={() => toggleSave(recipe.id)}
                            className="shrink-0 cursor-pointer rounded-lg border border-nido-border p-1.5 text-nido-muted transition-colors hover:bg-nido-bg hover:text-nido-ink"
                            aria-label="Guardar receta"
                        >
                            <Bookmark
                            className={`h-3.5 w-3.5 ${
                                isSaved ? 'fill-nido-olive text-nido-olive' : ''
                            }`}
                            />
                        </button>
                        </div>

                        {/* Tiempo y porciones */}
                        <div className="mt-2 flex items-center gap-4 text-xs text-nido-muted">
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-nido-subtle" />
                            {recipe.prepTime} min
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-nido-subtle" />
                            {recipe.servings} porciones
                        </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Pill de disponibilidad */}
                        {isReady ? (
                        <div className="flex items-center justify-between rounded-xl bg-nido-sage-bg px-3 py-2 text-xs font-medium text-nido-sage-text">
                            <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {recipe.availableCount}/{recipe.totalCount} disponibles
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-nido-sage-text" />
                        </div>
                        ) : (
                        <div className="flex items-center justify-between rounded-xl bg-nido-terracotta-bg px-3 py-2 text-xs font-medium text-nido-terracotta-text">
                            <span className="inline-flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {recipe.availableCount}/{recipe.totalCount} disponibles · faltan{' '}
                            {missingCount}
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-nido-terracotta-text" />
                        </div>
                        )}

                        {/* Botón Cocinar receta */}
                        <button
                        type="button"
                        disabled={!isReady}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-colors ${
                            isReady
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
        </div>
    );
};