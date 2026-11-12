import { useMemo, useState, type FC } from 'react';
import {
    CheckCircle2,
    ClipboardList,
    Filter,
    MoreHorizontal,
    Package,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StockBadge } from '@/components/ui/StockBadge';
import {
    getStockStatus,
    MOCK_MOVEMENTS,
    MOCK_PRODUCTS,
    type MovementMock,
    type ProductMock,
} from '@/mocks/inventory';
import { ProductDetail } from '@/pages/Products/ProductDetail';
import { ProductForm, type ProductFormValues } from '@/pages/Products/ProductForm';
import { StockAdjuster } from '@/pages/Products/StockAdjuster';

const CONTAINER_FILTERS = ['Todos', 'Alacena', 'Heladera', 'Freezer', 'Cocina', 'Lavadero', 'Baño'];

type ActiveModal =
    | { kind: 'create' }
    | { kind: 'edit'; productId: string }
    | { kind: 'adjust'; productId: string }
    | { kind: 'detail'; productId: string }
    | { kind: 'delete'; productId: string }
    | null;

export const Products: FC = () => {
    const [products, setProducts] = useState<ProductMock[]>(MOCK_PRODUCTS);
    const [movements, setMovements] = useState<MovementMock[]>(MOCK_MOVEMENTS);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [selectedContainer, setSelectedContainer] = useState('Todos');
    const [onlyLowStock, setOnlyLowStock] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [modal, setModal] = useState<ActiveModal>(null);
    const [toast, setToast] = useState<string | null>(null);

    const categories = useMemo(
        () => ['Todas', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort()],
        [products],
    );

    const filteredProducts = products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.trim().toLowerCase());
        const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
        const matchesContainer = selectedContainer === 'Todos' || p.containers.includes(selectedContainer);
        const matchesLow = !onlyLowStock || p.currentStock < p.minStock;
        return matchesSearch && matchesCategory && matchesContainer && matchesLow;
    });

    const modalProduct =
        modal && modal.kind !== 'create' ? products.find((p) => p.id === modal.productId) : undefined;

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const addMovement = (productId: string, quantity: number, reason: string | null) => {
        setMovements((prev) => [
            {
                id: `m-${Date.now()}-${productId}`,
                productId,
                quantity,
                type: 'manual',
                reason,
                createdAt: new Date().toISOString(),
            },
            ...prev,
        ]);
    };

    const handleCreate = (values: ProductFormValues) => {
        const id = String(Date.now());
        setProducts((prev) => [{ id, ...values, usedInRecipes: [] }, ...prev]);
        if (values.currentStock > 0) addMovement(id, values.currentStock, 'Stock inicial');
        setModal(null);
        showToast(`Producto "${values.name}" creado.`);
    };

    const handleEdit = (productId: string, values: ProductFormValues) => {
        setProducts((prev) =>
            prev.map((p) =>
                p.id === productId
                    ? {
                          ...p,
                          name: values.name,
                          category: values.category,
                          unit: values.unit,
                          minStock: values.minStock,
                          reorderQuantity: values.reorderQuantity,
                          containers: values.containers,
                      }
                    : p,
            ),
        );
        setModal(null);
        showToast('Cambios guardados.');
    };

    const handleAdjust = (productId: string, delta: number, reason: string) => {
        setProducts((prev) =>
            prev.map((p) => (p.id === productId ? { ...p, currentStock: p.currentStock + delta } : p)),
        );
        addMovement(productId, delta, reason || null);
        setModal(null);
        showToast('Ajuste registrado en el historial de auditoría.');
    };

    const handleDelete = (productId: string) => {
        const target = products.find((p) => p.id === productId);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setMovements((prev) => prev.filter((m) => m.productId !== productId));
        setModal(null);
        if (target) showToast(`Producto "${target.name}" eliminado junto con su historial.`);
    };

    const openFromMenu = (next: NonNullable<ActiveModal>) => {
        setOpenMenuId(null);
        setModal(next);
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
                            placeholder="Buscar por nombre..."
                            aria-label="Buscar producto por nombre"
                            className="w-full rounded-xl border border-nido-border bg-nido-bg py-2 pr-4 pl-9 text-xs text-nido-ink placeholder:text-nido-subtle focus:border-nido-olive focus:bg-nido-surface focus:outline-none"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setModal({ kind: 'create' })}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-nido-olive-hover"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Nuevo producto</span>
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

                {/* Filtros */}
                <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {CONTAINER_FILTERS.map((cont) => (
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

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            aria-label="Filtrar por categoría"
                            className="cursor-pointer rounded-xl border border-nido-border bg-nido-surface px-3 py-1.5 text-xs font-medium text-nido-ink focus:border-nido-olive focus:outline-none"
                        >
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category === 'Todas' ? 'Todas las categorías' : category}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={() => setOnlyLowStock((prev) => !prev)}
                            aria-pressed={onlyLowStock}
                            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                                onlyLowStock
                                    ? 'border-nido-terracotta-border bg-nido-terracotta-bg font-semibold text-nido-terracotta-text'
                                    : 'border-nido-border bg-nido-surface text-nido-secondary hover:text-nido-ink'
                            }`}
                        >
                            <Filter className="h-3.5 w-3.5" />
                            <span>Solo stock bajo</span>
                        </button>
                    </div>
                </div>

                {/* Tabla de inventario */}
                <div className="overflow-hidden rounded-2xl border border-nido-border bg-nido-surface">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-nido-border bg-nido-card-alt text-[11px] font-semibold tracking-wider text-nido-subtle uppercase">
                                    <th className="px-5 py-3.5">Nombre</th>
                                    <th className="px-5 py-3.5">Categoría</th>
                                    <th className="px-5 py-3.5">Contenedores</th>
                                    <th className="px-5 py-3.5">Stock actual</th>
                                    <th className="px-5 py-3.5">Stock mín.</th>
                                    <th className="px-5 py-3.5">Unidad</th>
                                    <th className="px-5 py-3.5">Estado</th>
                                    <th className="px-5 py-3.5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-nido-border text-xs">
                                {filteredProducts.map((product) => {
                                    const status = getStockStatus(product.currentStock, product.minStock);
                                    const isMenuOpen = openMenuId === product.id;

                                    return (
                                        <tr key={product.id} className="transition-colors hover:bg-nido-bg/60">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-nido-olive-soft text-nido-olive">
                                                        <Package className="h-4 w-4" />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setModal({ kind: 'detail', productId: product.id })}
                                                        className="cursor-pointer text-left font-semibold text-nido-ink hover:underline"
                                                    >
                                                        {product.name}
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-nido-secondary">
                                                {product.category || <span className="text-nido-subtle">—</span>}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {product.containers.length === 0 ? (
                                                        <span className="text-nido-subtle">—</span>
                                                    ) : (
                                                        product.containers.map((container) => (
                                                            <span
                                                                key={container}
                                                                className="rounded-lg border border-nido-border bg-nido-card-alt px-2 py-0.5 text-[11px] font-medium text-nido-secondary"
                                                            >
                                                                {container}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 font-semibold text-nido-ink">
                                                {product.currentStock}
                                            </td>
                                            <td className="px-5 py-4 text-nido-secondary">{product.minStock}</td>
                                            <td className="px-5 py-4 text-nido-secondary">{product.unit}</td>

                                            <td className="px-5 py-4">
                                                <StockBadge status={status} />
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <div className="relative inline-block text-left">
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenMenuId(isMenuOpen ? null : product.id)}
                                                        aria-label={`Acciones para ${product.name}`}
                                                        aria-expanded={isMenuOpen}
                                                        className="cursor-pointer rounded-lg p-1.5 text-nido-subtle transition-colors hover:bg-nido-bg hover:text-nido-ink"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>

                                                    {isMenuOpen && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                aria-label="Cerrar menú"
                                                                onClick={() => setOpenMenuId(null)}
                                                                className="fixed inset-0 z-10 cursor-default"
                                                            />
                                                            <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-nido-border bg-nido-surface py-1 shadow-lg">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openFromMenu({ kind: 'adjust', productId: product.id })}
                                                                    className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-xs text-nido-ink hover:bg-nido-bg"
                                                                >
                                                                    <SlidersHorizontal className="h-3.5 w-3.5 text-nido-secondary" />
                                                                    Ajustar stock
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openFromMenu({ kind: 'detail', productId: product.id })}
                                                                    className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-xs text-nido-ink hover:bg-nido-bg"
                                                                >
                                                                    <ClipboardList className="h-3.5 w-3.5 text-nido-secondary" />
                                                                    Ver historial
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openFromMenu({ kind: 'edit', productId: product.id })}
                                                                    className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-xs text-nido-ink hover:bg-nido-bg"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5 text-nido-secondary" />
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openFromMenu({ kind: 'delete', productId: product.id })}
                                                                    className="flex w-full cursor-pointer items-center gap-2 border-t border-nido-border px-3.5 py-2 text-xs text-nido-terracotta-text hover:bg-nido-terracotta-bg"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                    Eliminar
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="px-6 py-12 text-center">
                            <Package className="mx-auto h-8 w-8 text-nido-subtle" />
                            <p className="mt-3 text-sm font-semibold text-nido-ink">Sin resultados</p>
                            <p className="mt-1 text-xs text-nido-muted">
                                Ningún producto coincide con los filtros aplicados.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modales */}
            {modal?.kind === 'create' && (
                <ProductForm
                    existingNames={products.map((p) => p.name)}
                    onSubmit={handleCreate}
                    onClose={() => setModal(null)}
                />
            )}

            {modal?.kind === 'edit' && modalProduct && (
                <ProductForm
                    product={modalProduct}
                    existingNames={products.map((p) => p.name)}
                    onSubmit={(values) => handleEdit(modalProduct.id, values)}
                    onClose={() => setModal(null)}
                />
            )}

            {modal?.kind === 'adjust' && modalProduct && (
                <StockAdjuster
                    product={modalProduct}
                    onSubmit={(delta, reason) => handleAdjust(modalProduct.id, delta, reason)}
                    onClose={() => setModal(null)}
                />
            )}

            {modal?.kind === 'detail' && modalProduct && (
                <ProductDetail
                    product={modalProduct}
                    movements={movements
                        .filter((m) => m.productId === modalProduct.id)
                        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
                    onClose={() => setModal(null)}
                />
            )}

            {modal?.kind === 'delete' && modalProduct && (
                <ConfirmDialog
                    title="Eliminar producto"
                    tone="danger"
                    confirmLabel="Eliminar"
                    description={
                        <>
                            Vas a eliminar <strong>{modalProduct.name}</strong> y todo su historial de movimientos.
                            Esta acción no se puede deshacer.
                        </>
                    }
                    blocking={modalProduct.usedInRecipes.length > 0}
                    warning={
                        modalProduct.usedInRecipes.length > 0
                            ? `No se puede eliminar: es ingrediente de ${modalProduct.usedInRecipes.join(', ')}. Desvinculalo de esas recetas primero (HTTP 409).`
                            : undefined
                    }
                    onConfirm={() => handleDelete(modalProduct.id)}
                    onCancel={() => setModal(null)}
                />
            )}
        </div>
    );
};
