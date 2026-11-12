import { useState, type FC, type FormEvent } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    Filter,
    Minus,
    Package,
    Plus,
    Search,
    X,
} from 'lucide-react';
import type { ProductUnit } from '@/types';

interface ProductMock {
    id: string;
    name: string;
    category: string;
    container: string;
    currentStock: number;
    minStock: number;
    unit: ProductUnit;
}

const INITIAL_PRODUCTS: ProductMock[] = [
    { id: '1', name: 'Leche entera', category: 'Lácteos', container: 'Heladera', currentStock: 1, minStock: 3, unit: 'l' },
    { id: '2', name: 'Aceite de oliva', category: 'Despensa', container: 'Alacena', currentStock: 250, minStock: 500, unit: 'ml' },
    { id: '3', name: 'Huevos de campo', category: 'Frescos', container: 'Heladera', currentStock: 4, minStock: 12, unit: 'unidad' },
    { id: '4', name: 'Arroz integral', category: 'Granos', container: 'Alacena', currentStock: 300, minStock: 1000, unit: 'g' },
    { id: '5', name: 'Papas blancas', category: 'Verduras', container: 'Alacena', currentStock: 2, minStock: 1, unit: 'kg' },
    { id: '6', name: 'Pechuga de pollo', category: 'Carnes', container: 'Freezer', currentStock: 1500, minStock: 800, unit: 'g' },
    { id: '7', name: 'Pasta penne', category: 'Pastas', container: 'Alacena', currentStock: 2, minStock: 1, unit: 'paquete' },
    { id: '8', name: 'Detergente líquido', category: 'Limpieza', container: 'Lavadero', currentStock: 1, minStock: 1, unit: 'botella' },
];

const CONTAINERS = ['Todos', 'Alacena', 'Heladera', 'Freezer', 'Lavadero', 'Baño'];

export const Products: FC = () => {
    const [products, setProducts] = useState<ProductMock[]>(INITIAL_PRODUCTS);
    const [search, setSearch] = useState('');
    const [selectedContainer, setSelectedContainer] = useState('Todos');
    const [onlyLowStock, setOnlyLowStock] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [name, setName] = useState('');
    const [category, setCategory] = useState('Despensa');
    const [container, setContainer] = useState('Alacena');
    const [currentStock, setCurrentStock] = useState('1');
    const [minStock, setMinStock] = useState('1');
    const [unit, setUnit] = useState<ProductUnit>('unidad');

    const filteredProducts = products.filter((p) => {
        const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
        const matchesContainer =
        selectedContainer === 'Todos' || p.container === selectedContainer;
        const matchesLow = !onlyLowStock || p.currentStock < p.minStock;
        return matchesSearch && matchesContainer && matchesLow;
    });

    const handleAdjustStock = (id: string, delta: number) => {
        setProducts((prev) =>
        prev.map((item) =>
            item.id === id
            ? { ...item, currentStock: Math.max(0, item.currentStock + delta) }
            : item,
        ),
        );
    };

    const handleCreateProduct = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name.trim()) return;

        const newProduct: ProductMock = {
        id: String(Date.now()),
        name: name.trim(),
        category,
        container,
        currentStock: Math.max(0, Number(currentStock) || 0),
        minStock: Math.max(0, Number(minStock) || 0),
        unit,
        };

        setProducts((prev) => [newProduct, ...prev]);
        setName('');
        setCurrentStock('1');
        setMinStock('1');
        setIsModalOpen(false);
    };

    return (
        <div className="flex min-h-screen flex-col">
        {/* Topbar */}
        <header className="flex flex-col justify-between gap-4 border-b border-nido-border bg-nido-surface px-6 py-4 sm:flex-row sm:items-center lg:px-8">
            <div>
            <h1 className="text-base font-bold text-nido-ink">Productos</h1>
            <p className="text-xs text-nido-subtle">
                {products.length} productos registrados en el inventario
            </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-nido-subtle" />
                <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto o categoría..."
                className="w-full rounded-xl border border-nido-border bg-nido-bg py-2 pr-4 pl-9 text-xs text-nido-ink placeholder:text-nido-subtle focus:border-nido-olive focus:bg-nido-surface focus:outline-none"
                />
            </div>

            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-nido-olive-hover"
            >
                <Plus className="h-4 w-4" />
                <span>Nuevo producto</span>
            </button>
            </div>
        </header>

        {/* Cuerpo */}
        <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
            {/* Filtros por contenedor + Stock bajo */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-1.5">
                {CONTAINERS.map((cont) => (
                <button
                    key={cont}
                    type="button"
                    onClick={() => setSelectedContainer(cont)}
                    className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedContainer === cont
                        ? 'bg-nido-olive font-semibold text-white'
                        : 'border border-nido-border bg-nido-surface text-nido-secondary hover:text-nido-ink'
                    }`}
                >
                    {cont}
                </button>
                ))}
            </div>

            <button
                type="button"
                onClick={() => setOnlyLowStock((prev) => !prev)}
                className={`inline-flex cursor-pointer items-center gap-2 self-start rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                onlyLowStock
                    ? 'border-nido-terracotta-border bg-nido-terracotta-bg font-semibold text-nido-terracotta-text'
                    : 'border-nido-border bg-nido-surface text-nido-secondary hover:text-nido-ink'
                }`}
            >
                <Filter className="h-3.5 w-3.5" />
                <span>Solo stock bajo</span>
            </button>
            </div>

            {/* Tabla de inventario */}
            <div className="overflow-hidden rounded-2xl border border-nido-border bg-nido-surface">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                <thead>
                    <tr className="border-b border-nido-border bg-nido-card-alt text-[11px] font-semibold tracking-wider text-nido-subtle uppercase">
                    <th className="px-5 py-3.5">Producto</th>
                    <th className="px-5 py-3.5">Ubicación</th>
                    <th className="px-5 py-3.5">Stock actual</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Ajuste rápido</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-nido-border text-xs">
                    {filteredProducts.map((product) => {
                    const isLow = product.currentStock < product.minStock;
                    const step = product.unit === 'g' || product.unit === 'ml' ? 100 : 1;

                    return (
                        <tr key={product.id} className="transition-colors hover:bg-nido-bg/60">
                        <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-nido-olive-soft text-nido-olive">
                                <Package className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-semibold text-nido-ink">{product.name}</p>
                                <p className="text-[11px] text-nido-subtle">{product.category}</p>
                            </div>
                            </div>
                        </td>

                        <td className="px-5 py-4">
                            <span className="rounded-lg border border-nido-border bg-nido-card-alt px-2.5 py-1 text-[11px] font-medium text-nido-secondary">
                            {product.container}
                            </span>
                        </td>

                        <td className="px-5 py-4 font-semibold text-nido-ink">
                            {product.currentStock} {product.unit}
                            <span className="ml-1.5 text-[11px] font-normal text-nido-subtle">
                            (mín. {product.minStock})
                            </span>
                        </td>

                        <td className="px-5 py-4">
                            {isLow ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-nido-terracotta-bg px-2.5 py-1 text-[11px] font-semibold text-nido-terracotta-text">
                                <AlertCircle className="h-3 w-3" />
                                Reponer
                            </span>
                            ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-nido-sage-bg px-2.5 py-1 text-[11px] font-semibold text-nido-sage-text">
                                <CheckCircle2 className="h-3 w-3" />
                                Óptimo
                            </span>
                            )}
                        </td>

                        <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center gap-1 rounded-xl border border-nido-border bg-nido-bg p-1">
                            <button
                                type="button"
                                onClick={() => handleAdjustStock(product.id, -step)}
                                aria-label="Disminuir stock"
                                className="cursor-pointer rounded-lg p-1 text-nido-secondary transition-colors hover:bg-nido-surface hover:text-nido-ink"
                            >
                                <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-8 text-center text-[11px] font-semibold text-nido-ink">
                                {step}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleAdjustStock(product.id, step)}
                                aria-label="Aumentar stock"
                                className="cursor-pointer rounded-lg p-1 text-nido-secondary transition-colors hover:bg-nido-surface hover:text-nido-ink"
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                            </div>
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
            </div>
        </div>

        {/* Modal Nuevo Producto */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-nido-ink/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-nido-border bg-nido-surface p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-bold text-nido-ink">Agregar producto</h2>
                <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="cursor-pointer rounded-lg p-1.5 text-nido-subtle hover:bg-nido-bg hover:text-nido-ink"
                >
                    <X className="h-4 w-4" />
                </button>
                </div>

                <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                    <label className="mb-1 block text-xs font-medium text-nido-ink">Nombre</label>
                    <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Harina 0000"
                    className="w-full rounded-xl border border-nido-border-strong px-3.5 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                    <label className="mb-1 block text-xs font-medium text-nido-ink">Categoría</label>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-xl border border-nido-border-strong px-3.5 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
                    />
                    </div>
                    <div>
                    <label className="mb-1 block text-xs font-medium text-nido-ink">Contenedor</label>
                    <select
                        value={container}
                        onChange={(e) => setContainer(e.target.value)}
                        className="w-full rounded-xl border border-nido-border-strong bg-nido-surface px-3 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
                    >
                        {CONTAINERS.filter((c) => c !== 'Todos').map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                        ))}
                    </select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                    <label className="mb-1 block text-xs font-medium text-nido-ink">Stock actual</label>
                    <input
                        type="number"
                        min="0"
                        value={currentStock}
                        onChange={(e) => setCurrentStock(e.target.value)}
                        className="w-full rounded-xl border border-nido-border-strong px-3 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
                    />
                    </div>
                    <div>
                    <label className="mb-1 block text-xs font-medium text-nido-ink">Stock mín.</label>
                    <input
                        type="number"
                        min="0"
                        value={minStock}
                        onChange={(e) => setMinStock(e.target.value)}
                        className="w-full rounded-xl border border-nido-border-strong px-3 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
                    />
                    </div>
                    <div>
                    <label className="mb-1 block text-xs font-medium text-nido-ink">Unidad</label>
                    <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as ProductUnit)}
                        className="w-full rounded-xl border border-nido-border-strong bg-nido-surface px-3 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
                    >
                        <option value="unidad">unidad</option>
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                        <option value="paquete">paquete</option>
                        <option value="botella">botella</option>
                    </select>
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                    <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="cursor-pointer rounded-xl border border-nido-border px-4 py-2 text-xs font-medium text-nido-secondary hover:bg-nido-bg"
                    >
                    Cancelar
                    </button>
                    <button
                    type="submit"
                    className="cursor-pointer rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white hover:bg-nido-olive-hover"
                    >
                    Guardar producto
                    </button>
                </div>
                </form>
            </div>
            </div>
        )}
        </div>
    );
};