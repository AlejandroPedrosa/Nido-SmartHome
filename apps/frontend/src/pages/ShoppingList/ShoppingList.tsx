import { useState, type FC, type FormEvent } from 'react';
import { Check, CheckCircle2, Plus, ShoppingBag, Sparkles, Trash2 } from 'lucide-react';
import type { ProductUnit } from '@/types';

interface ShoppingItemMock {
    id: string;
    name: string;
    quantity: number;
    unit: ProductUnit;
    container: string;
    isAutoSuggested: boolean;
    purchased: boolean;
}

const INITIAL_ITEMS: ShoppingItemMock[] = [
    { id: '1', name: 'Leche entera', quantity: 3, unit: 'l', container: 'Heladera', isAutoSuggested: true, purchased: false },
    { id: '2', name: 'Aceite de oliva', quantity: 500, unit: 'ml', container: 'Alacena', isAutoSuggested: true, purchased: false },
    { id: '3', name: 'Huevos de campo', quantity: 12, unit: 'unidad', container: 'Heladera', isAutoSuggested: true, purchased: false },
    { id: '4', name: 'Arroz integral', quantity: 1000, unit: 'g', container: 'Alacena', isAutoSuggested: true, purchased: false },
    { id: '5', name: 'Queso rallado', quantity: 200, unit: 'g', container: 'Heladera', isAutoSuggested: false, purchased: true },
    { id: '6', name: 'Servilletas de papel', quantity: 2, unit: 'paquete', container: 'Cocina', isAutoSuggested: true, purchased: false },
    { id: '7', name: 'Jabón líquido ropa', quantity: 1, unit: 'botella', container: 'Lavadero', isAutoSuggested: true, purchased: false },
];

export const ShoppingList: FC = () => {
    const [items, setItems] = useState<ShoppingItemMock[]>(INITIAL_ITEMS);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('1');
    const [newItemUnit, setNewItemUnit] = useState<ProductUnit>('unidad');
    const [confirmedToast, setConfirmedToast] = useState(false);

    const pendingCount = items.filter((i) => !i.purchased).length;
    const purchasedCount = items.filter((i) => i.purchased).length;

    const togglePurchased = (id: string) => {
        setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, purchased: !item.purchased } : item)),
        );
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const handleAddItem = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        setItems((prev) => [
        {
            id: String(Date.now()),
            name: newItemName.trim(),
            quantity: Math.max(1, Number(newItemQty) || 1),
            unit: newItemUnit,
            container: 'Alacena',
            isAutoSuggested: false,
            purchased: false,
        },
        ...prev,
        ]);

        setNewItemName('');
        setNewItemQty('1');
    };

    const handleConfirmPurchase = () => {
        setItems((prev) => prev.filter((item) => !item.purchased));
        setConfirmedToast(true);
        setTimeout(() => setConfirmedToast(false), 3000);
    };

    return (
        <div className="flex min-h-screen flex-col">
        {/* Topbar */}
        <header className="flex flex-col justify-between gap-4 border-b border-nido-border bg-nido-surface px-6 py-4 sm:flex-row sm:items-center lg:px-8">
            <div>
            <h1 className="text-base font-bold text-nido-ink">Lista de Compras</h1>
            <p className="text-xs text-nido-subtle">
                {pendingCount} pendientes · {purchasedCount} marcados en el carrito
            </p>
            </div>

            <button
            type="button"
            disabled={purchasedCount === 0}
            onClick={handleConfirmPurchase}
            className={`inline-flex items-center gap-1.5 self-start rounded-xl px-4 py-2 text-xs font-semibold transition-colors sm:self-auto ${
                purchasedCount > 0
                ? 'cursor-pointer bg-nido-olive text-white shadow-xs hover:bg-nido-olive-hover'
                : 'cursor-not-allowed border border-nido-border bg-nido-bg text-nido-subtle'
            }`}
            >
            <CheckCircle2 className="h-4 w-4" />
            <span>Ingresar comprados al stock ({purchasedCount})</span>
            </button>
        </header>

        {/* Cuerpo */}
        <div className="mx-auto w-full max-w-4xl space-y-6 p-6 lg:p-8">
            {confirmedToast && (
            <div className="flex items-center gap-2 rounded-2xl border border-nido-sage-text/20 bg-nido-sage-bg px-4 py-3 text-xs font-medium text-nido-sage-text">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Productos comprados sumados automáticamente al inventario del hogar.</span>
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
                <option value="unidad">unidad</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="paquete">paquete</option>
                <option value="botella">botella</option>
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
                    className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors ${
                        item.purchased
                        ? 'border-nido-olive bg-nido-olive text-white'
                        : 'border-nido-border-strong bg-nido-surface hover:border-nido-olive'
                    }`}
                    >
                    {item.purchased && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                    </button>

                    <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                        className={`text-xs font-semibold ${
                            item.purchased ? 'text-nido-subtle line-through' : 'text-nido-ink'
                        }`}
                        >
                        {item.name}
                        </span>
                        {item.isAutoSuggested && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-nido-olive-soft px-2 py-0.5 text-[10px] font-medium text-nido-olive">
                            <Sparkles className="h-2.5 w-2.5" />
                            Stock bajo
                        </span>
                        )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-nido-subtle">
                        Destino: {item.container}
                    </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="rounded-lg border border-nido-border bg-nido-bg px-2.5 py-1 text-xs font-semibold text-nido-ink">
                    {item.quantity} {item.unit}
                    </span>
                    <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Eliminar de la lista"
                    className="cursor-pointer rounded-lg p-1.5 text-nido-subtle transition-colors hover:bg-nido-terracotta-bg hover:text-nido-terracotta-text"
                    >
                    <Trash2 className="h-4 w-4" />
                    </button>
                </div>
                </div>
            ))}
            </div>
        </div>
        </div>
    );
};