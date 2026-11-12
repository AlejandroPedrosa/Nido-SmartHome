import { useState, type FC, type FormEvent } from 'react';
import {
    Check,
    CheckCircle2,
    ChevronDown,
    History,
    PackageCheck,
    Plus,
    RefreshCw,
    ShoppingBag,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MOCK_PRODUCTS, PRODUCT_UNITS, type ProductMock } from '@/mocks/inventory';
import type { ProductUnit } from '@/types';

interface ShoppingItemMock {
    id: string;
    /** Producto del inventario al que acredita stock. Los ítems manuales no lo tienen. */
    productId: string | null;
    name: string;
    quantity: number;
    unit: ProductUnit;
    purchased: boolean;
}

interface ClosedListMock {
    id: string;
    purchasedAt: string;
    items: { name: string; quantity: number; unit: ProductUnit }[];
}

type Tab = 'active' | 'history';

/** RS-02: usa la reposición sugerida si existe, o lo que falta para llegar al mínimo. */
const getSuggestedQuantity = (product: ProductMock): number =>
    product.reorderQuantity ?? Number((product.minStock - product.currentStock).toFixed(3));

const getShortages = (products: ProductMock[]): ProductMock[] =>
    products.filter((p) => p.currentStock < p.minStock);

const toItem = (product: ProductMock, purchased = false): ShoppingItemMock => ({
    id: `item-${product.id}`,
    productId: product.id,
    name: product.name,
    quantity: getSuggestedQuantity(product),
    unit: product.unit,
    purchased,
});

const INITIAL_ITEMS: ShoppingItemMock[] = [
    ...getShortages(MOCK_PRODUCTS)
        .filter((p) => p.id !== '9')
        .map((p) => toItem(p)),
    { id: 'manual-queso', productId: null, name: 'Queso rallado', quantity: 200, unit: 'g', purchased: true },
];

const INITIAL_HISTORY: ClosedListMock[] = [
    {
        id: 'h2',
        purchasedAt: '2026-11-09T19:40:00Z',
        items: [
            { name: 'Leche entera', quantity: 2, unit: 'l' },
            { name: 'Pasta penne', quantity: 2, unit: 'paquete' },
            { name: 'Papas blancas', quantity: 2, unit: 'kg' },
        ],
    },
    {
        id: 'h1',
        purchasedAt: '2026-11-02T11:15:00Z',
        items: [
            { name: 'Pechuga de pollo', quantity: 1500, unit: 'g' },
            { name: 'Detergente líquido', quantity: 1, unit: 'botella' },
        ],
    },
];

const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });

export const ShoppingList: FC = () => {
    const [tab, setTab] = useState<Tab>('active');
    const [products, setProducts] = useState<ProductMock[]>(MOCK_PRODUCTS);
    const [items, setItems] = useState<ShoppingItemMock[]>(INITIAL_ITEMS);
    const [history, setHistory] = useState<ClosedListMock[]>(INITIAL_HISTORY);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('1');
    const [newItemUnit, setNewItemUnit] = useState<ProductUnit>('unidad');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [notice, setNotice] = useState<{ tone: 'success' | 'complete'; message: string } | null>(null);

    const totalCount = items.length;
    const purchasedCount = items.filter((i) => i.purchased).length;
    const progress = totalCount === 0 ? 0 : Math.round((purchasedCount / totalCount) * 100);
    const purchasedItems = items.filter((i) => i.purchased);

    const showNotice = (next: NonNullable<typeof notice>) => {
        setNotice(next);
        setTimeout(() => setNotice(null), 4000);
    };

    const togglePurchased = (id: string) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, purchased: !item.purchased } : item)));
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleAddItem = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        setItems((prev) => [
            {
                id: `manual-${Date.now()}`,
                productId: null,
                name: newItemName.trim(),
                quantity: Math.max(1, Number(newItemQty) || 1),
                unit: newItemUnit,
                purchased: false,
            },
            ...prev,
        ]);
        setNewItemName('');
        setNewItemQty('1');
    };

    /** LC-03 / LC-06: preserva lo comprado, actualiza faltantes y depura lo que ya recuperó stock. */
    const handleSync = () => {
        const shortages = getShortages(products);

        setItems((prev) => {
            const kept = prev.filter((item) => item.purchased);
            const keptProductIds = new Set(kept.map((item) => item.productId));
            const fresh = shortages.filter((p) => !keptProductIds.has(p.id)).map((p) => toItem(p));
            return [...fresh, ...kept];
        });

        if (shortages.length === 0) {
            showNotice({ tone: 'complete', message: 'Inventario completo: no hay productos por debajo del mínimo.' });
        } else {
            showNotice({
                tone: 'success',
                message: `Lista sincronizada con ${shortages.length} ${shortages.length === 1 ? 'faltante' : 'faltantes'}.`,
            });
        }
    };

    /** RS-05 / LC-04: acredita solo lo marcado, archiva la lista y la cierra. */
    const handleConfirmPurchase = () => {
        setProducts((prev) =>
            prev.map((product) => {
                const bought = purchasedItems.find((item) => item.productId === product.id);
                return bought
                    ? { ...product, currentStock: Number((product.currentStock + bought.quantity).toFixed(3)) }
                    : product;
            }),
        );
        setHistory((prev) => [
            {
                id: `h-${Date.now()}`,
                purchasedAt: new Date().toISOString(),
                items: purchasedItems.map(({ name, quantity, unit }) => ({ name, quantity, unit })),
            },
            ...prev,
        ]);
        setItems([]);
        setIsConfirmOpen(false);
        showNotice({ tone: 'success', message: 'Compra confirmada: el stock se actualizó y la lista quedó archivada.' });
    };

    return (
        <div className="flex min-h-screen flex-col">
            {/* Topbar */}
            <header className="flex flex-col justify-between gap-4 border-b border-nido-border bg-nido-surface px-6 py-4 sm:flex-row sm:items-center lg:px-8">
                <div>
                    <h1 className="text-base font-bold text-nido-ink">Lista de Compras</h1>
                    <p className="text-xs text-nido-subtle">
                        {totalCount - purchasedCount} pendientes · {purchasedCount} marcados en el carrito
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleSync}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-nido-border bg-nido-surface px-3.5 py-2 text-xs font-medium text-nido-ink transition-colors hover:bg-nido-bg"
                    >
                        <RefreshCw className="h-3.5 w-3.5 text-nido-secondary" />
                        <span>Sincronizar faltantes</span>
                    </button>

                    <button
                        type="button"
                        disabled={purchasedCount === 0}
                        onClick={() => setIsConfirmOpen(true)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                            purchasedCount > 0
                                ? 'cursor-pointer bg-nido-olive text-white shadow-xs hover:bg-nido-olive-hover'
                                : 'cursor-not-allowed border border-nido-border bg-nido-bg text-nido-subtle'
                        }`}
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Confirmar compra ({purchasedCount})</span>
                    </button>
                </div>
            </header>

            {/* Cuerpo */}
            <div className="mx-auto w-full max-w-4xl space-y-6 p-6 lg:p-8">
                {notice && (
                    <div
                        role="status"
                        className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-medium ${
                            notice.tone === 'complete'
                                ? 'border-nido-border bg-nido-olive-soft text-nido-olive'
                                : 'border-nido-sage-text/20 bg-nido-sage-bg text-nido-sage-text'
                        }`}
                    >
                        {notice.tone === 'complete' ? (
                            <PackageCheck className="h-4 w-4 shrink-0" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                        )}
                        <span>{notice.message}</span>
                    </div>
                )}

                {/* Pestañas */}
                <div className="inline-flex items-center rounded-xl border border-nido-border bg-nido-surface p-1">
                    <button
                        type="button"
                        onClick={() => setTab('active')}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                            tab === 'active' ? 'bg-nido-olive text-white' : 'text-nido-secondary hover:text-nido-ink'
                        }`}
                    >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Lista activa
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('history')}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                            tab === 'history' ? 'bg-nido-olive text-white' : 'text-nido-secondary hover:text-nido-ink'
                        }`}
                    >
                        <History className="h-3.5 w-3.5" />
                        Historial
                        <span
                            className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                                tab === 'history' ? 'bg-white/20 text-white' : 'bg-nido-olive-soft text-nido-ink'
                            }`}
                        >
                            {history.length}
                        </span>
                    </button>
                </div>

                {tab === 'active' ? (
                    <>
                        {/* Barra de progreso */}
                        {totalCount > 0 && (
                            <div className="rounded-2xl border border-nido-border bg-nido-surface p-5">
                                <div className="mb-2 flex items-center justify-between text-xs">
                                    <span className="font-semibold text-nido-ink">
                                        {purchasedCount} de {totalCount} productos comprados
                                    </span>
                                    <span className="font-semibold text-nido-muted">{progress}%</span>
                                </div>
                                <div
                                    role="progressbar"
                                    aria-valuenow={progress}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    className="h-2 w-full overflow-hidden rounded-full bg-nido-olive-soft"
                                >
                                    <div
                                        className="h-full rounded-full bg-nido-olive transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Formulario rápido de agregado manual */}
                        <form
                            onSubmit={handleAddItem}
                            className="flex flex-col gap-2.5 rounded-2xl border border-nido-border bg-nido-surface p-4 sm:flex-row sm:items-center"
                        >
                            <div className="relative flex-1">
                                <ShoppingBag className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-nido-subtle" />
                                <input
                                    type="text"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    placeholder="Agregar producto manual a la lista..."
                                    className="w-full rounded-xl border border-nido-border bg-nido-bg py-2 pr-4 pl-9 text-xs text-nido-ink placeholder:text-nido-subtle focus:border-nido-olive focus:bg-nido-surface focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    value={newItemQty}
                                    onChange={(e) => setNewItemQty(e.target.value)}
                                    aria-label="Cantidad"
                                    className="w-20 rounded-xl border border-nido-border bg-nido-bg px-3 py-2 text-xs text-nido-ink focus:border-nido-olive focus:bg-nido-surface focus:outline-none"
                                />
                                <select
                                    value={newItemUnit}
                                    onChange={(e) => setNewItemUnit(e.target.value as ProductUnit)}
                                    aria-label="Unidad"
                                    className="rounded-xl border border-nido-border bg-nido-surface px-3 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
                                >
                                    {PRODUCT_UNITS.map((unit) => (
                                        <option key={unit} value={unit}>
                                            {unit}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-nido-olive-hover"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>Sumar</span>
                                </button>
                            </div>
                        </form>

                        {/* Lista de ítems */}
                        {items.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-nido-border-strong bg-nido-surface px-6 py-14 text-center">
                                <PackageCheck className="mx-auto h-8 w-8 text-nido-sage-text" />
                                <p className="mt-3 text-sm font-semibold text-nido-ink">Inventario completo</p>
                                <p className="mt-1 text-xs text-nido-muted">
                                    No hay ítems en la lista. Usá "Sincronizar faltantes" para revisar si algún producto
                                    cayó por debajo del mínimo.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-nido-border overflow-hidden rounded-2xl border border-nido-border bg-nido-surface">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`flex items-center justify-between gap-4 px-5 py-4 transition-colors ${
                                            item.purchased ? 'bg-nido-card-alt/70' : 'hover:bg-nido-bg/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <button
                                                type="button"
                                                onClick={() => togglePurchased(item.id)}
                                                aria-label={`Marcar ${item.name}`}
                                                aria-pressed={item.purchased}
                                                className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors ${
                                                    item.purchased
                                                        ? 'border-nido-olive bg-nido-olive text-white'
                                                        : 'border-nido-border-strong bg-nido-surface hover:border-nido-olive'
                                                }`}
                                            >
                                                {item.purchased && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                                            </button>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`text-xs font-semibold ${
                                                        item.purchased ? 'text-nido-subtle line-through' : 'text-nido-ink'
                                                    }`}
                                                >
                                                    {item.name}
                                                </span>
                                                {item.productId !== null && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-nido-olive-soft px-2 py-0.5 text-[10px] font-medium text-nido-olive">
                                                        <Sparkles className="h-2.5 w-2.5" />
                                                        Stock bajo
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="rounded-lg border border-nido-border bg-nido-bg px-2.5 py-1 text-xs font-semibold text-nido-ink">
                                                {item.quantity} {item.unit}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                aria-label={`Quitar ${item.name} de la lista`}
                                                className="cursor-pointer rounded-lg p-1.5 text-nido-subtle transition-colors hover:bg-nido-terracotta-bg hover:text-nido-terracotta-text"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-3">
                        {history.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-nido-border-strong bg-nido-surface px-6 py-14 text-center">
                                <History className="mx-auto h-8 w-8 text-nido-subtle" />
                                <p className="mt-3 text-sm font-semibold text-nido-ink">Todavía no hay compras cerradas</p>
                                <p className="mt-1 text-xs text-nido-muted">
                                    Cuando confirmes una compra, la lista queda registrada acá.
                                </p>
                            </div>
                        ) : (
                            history.map((list) => (
                                <details
                                    key={list.id}
                                    className="group overflow-hidden rounded-2xl border border-nido-border bg-nido-surface"
                                >
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 hover:bg-nido-bg/50">
                                        <div>
                                            <p className="text-xs font-semibold text-nido-ink">
                                                Compra del {formatDate(list.purchasedAt)}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-nido-subtle">
                                                {list.items.length}{' '}
                                                {list.items.length === 1 ? 'insumo comprado' : 'insumos comprados'}
                                            </p>
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-nido-subtle transition-transform group-open:rotate-180" />
                                    </summary>
                                    <ul className="divide-y divide-nido-border border-t border-nido-border bg-nido-card-alt/50">
                                        {list.items.map((item) => (
                                            <li
                                                key={item.name}
                                                className="flex items-center justify-between px-5 py-3 text-xs"
                                            >
                                                <span className="font-medium text-nido-ink">{item.name}</span>
                                                <span className="rounded-lg bg-nido-sage-bg px-2.5 py-1 text-[11px] font-semibold text-nido-sage-text">
                                                    +{item.quantity} {item.unit}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            ))
                        )}
                    </div>
                )}
            </div>

            {isConfirmOpen && (
                <ConfirmDialog
                    title="Confirmar compra"
                    confirmLabel="Confirmar compra"
                    description="Se va a sumar al inventario el stock de los productos marcados y la lista quedará archivada en el historial."
                    onConfirm={handleConfirmPurchase}
                    onCancel={() => setIsConfirmOpen(false)}
                >
                    <ul className="divide-y divide-nido-border overflow-hidden rounded-xl border border-nido-border">
                        {purchasedItems.map((item) => (
                            <li key={item.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                                <span className="font-medium text-nido-ink">{item.name}</span>
                                <span className="rounded-lg bg-nido-sage-bg px-2 py-0.5 text-[11px] font-semibold text-nido-sage-text">
                                    +{item.quantity} {item.unit}
                                </span>
                            </li>
                        ))}
                    </ul>
                    {totalCount > purchasedCount && (
                        <p className="text-[11px] text-nido-subtle">
                            Los {totalCount - purchasedCount} ítems sin marcar no se compran: volverán a aparecer al
                            sincronizar si siguen bajo el mínimo.
                        </p>
                    )}
                </ConfirmDialog>
            )}
        </div>
    );
};
