import { useState, type FC } from 'react';
import { Check, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { ProductMock } from '@/mocks/inventory';

interface ProductAssignerProps {
    containerName: string;
    products: ProductMock[];
    /** Recibe los ids que quedan asignados al contenedor (vincula y desvincula en una sola operación). */
    onSave: (assignedIds: string[]) => void;
    onClose: () => void;
}

export const ProductAssigner: FC<ProductAssignerProps> = ({ containerName, products, onSave, onClose }) => {
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>(
        products.filter((p) => p.containers.includes(containerName)).map((p) => p.id),
    );

    const visibleProducts = products.filter((p) =>
        p.name.toLowerCase().includes(search.trim().toLowerCase()),
    );

    const toggle = (id: string) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    return (
        <Modal
            title="Asignar productos"
            subtitle={`${containerName} · ${selectedIds.length} seleccionados`}
            onClose={onClose}
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-xl border border-nido-border px-4 py-2 text-xs font-medium text-nido-secondary hover:bg-nido-bg"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave(selectedIds)}
                        className="cursor-pointer rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white hover:bg-nido-olive-hover"
                    >
                        Guardar asignación
                    </button>
                </>
            }
        >
            <div className="space-y-3 pb-2">
                <div className="relative">
                    <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-nido-subtle" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar producto..."
                        aria-label="Buscar producto"
                        className="w-full rounded-xl border border-nido-border bg-nido-bg py-2 pr-4 pl-9 text-xs text-nido-ink placeholder:text-nido-subtle focus:border-nido-olive focus:bg-nido-surface focus:outline-none"
                    />
                </div>

                <ul className="max-h-72 divide-y divide-nido-border overflow-y-auto rounded-xl border border-nido-border">
                    {visibleProducts.map((product) => {
                        const checked = selectedIds.includes(product.id);
                        const others = product.containers.filter((c) => c !== containerName);
                        return (
                            <li key={product.id}>
                                <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-nido-bg/60">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggle(product.id)}
                                        className="sr-only"
                                    />
                                    <span
                                        aria-hidden="true"
                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                            checked
                                                ? 'border-nido-olive bg-nido-olive text-white'
                                                : 'border-nido-border-strong bg-nido-surface'
                                        }`}
                                    >
                                        {checked && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-xs font-semibold text-nido-ink">{product.name}</span>
                                        <span className="block text-[11px] text-nido-subtle">
                                            {others.length > 0 ? `También en: ${others.join(', ')}` : 'Sin otros contenedores'}
                                        </span>
                                    </span>
                                </label>
                            </li>
                        );
                    })}
                    {visibleProducts.length === 0 && (
                        <li className="px-4 py-6 text-center text-xs text-nido-subtle">Sin resultados.</li>
                    )}
                </ul>

                <p className="text-[11px] text-nido-subtle">
                    Un producto puede estar en varios contenedores a la vez.
                </p>
            </div>
        </Modal>
    );
};
