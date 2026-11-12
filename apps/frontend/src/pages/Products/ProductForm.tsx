import { useState, type FC, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { MOCK_CONTAINER_NAMES, PRODUCT_UNITS, type ProductMock } from '@/mocks/inventory';
import type { ProductUnit } from '@/types';

export interface ProductFormValues {
    name: string;
    category: string;
    unit: ProductUnit;
    currentStock: number;
    minStock: number;
    reorderQuantity: number | null;
    containers: string[];
}

interface ProductFormProps {
    /** Si viene, el modal funciona en modo edición (el stock no se edita, solo se ajusta). */
    product?: ProductMock;
    /** Nombres ya usados por el usuario, para simular el 409 de unicidad (UG-01). */
    existingNames: string[];
    onSubmit: (values: ProductFormValues) => void;
    onClose: () => void;
}

const inputClasses =
    'w-full rounded-xl border border-nido-border-strong bg-nido-surface px-3.5 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none';

export const ProductForm: FC<ProductFormProps> = ({ product, existingNames, onSubmit, onClose }) => {
    const isEdit = product !== undefined;

    const [name, setName] = useState(product?.name ?? '');
    const [category, setCategory] = useState(product?.category ?? '');
    const [unit, setUnit] = useState<ProductUnit>(product?.unit ?? 'unidad');
    const [currentStock, setCurrentStock] = useState(String(product?.currentStock ?? 0));
    const [minStock, setMinStock] = useState(String(product?.minStock ?? 0));
    const [reorderQuantity, setReorderQuantity] = useState(
        product?.reorderQuantity != null ? String(product.reorderQuantity) : '',
    );
    const [containers, setContainers] = useState<string[]>(product?.containers ?? []);
    const [error, setError] = useState<string | null>(null);

    const toggleContainer = (container: string) => {
        setContainers((prev) =>
            prev.includes(container) ? prev.filter((c) => c !== container) : [...prev, container],
        );
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError('El nombre es obligatorio.');
            return;
        }

        const normalized = trimmed.toLowerCase();
        const isDuplicate = existingNames.some(
            (existing) =>
                existing.trim().toLowerCase() === normalized &&
                existing.trim().toLowerCase() !== product?.name.trim().toLowerCase(),
        );
        if (isDuplicate) {
            setError('Ya existe un producto con ese nombre (HTTP 409).');
            return;
        }

        const reorder = reorderQuantity.trim() === '' ? null : Number(reorderQuantity);
        if (reorder !== null && !(reorder > 0)) {
            setError('La reposición sugerida debe ser mayor a 0 o quedar vacía.');
            return;
        }

        onSubmit({
            name: trimmed,
            category: category.trim(),
            unit,
            currentStock: Math.max(0, Number(currentStock) || 0),
            minStock: Math.max(0, Number(minStock) || 0),
            reorderQuantity: reorder,
            containers,
        });
    };

    return (
        <Modal
            title={isEdit ? 'Editar producto' : 'Agregar producto'}
            subtitle={isEdit ? 'El stock se modifica desde "Ajustar stock" para dejar auditoría.' : undefined}
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
                        type="submit"
                        form="product-form"
                        className="cursor-pointer rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white hover:bg-nido-olive-hover"
                    >
                        {isEdit ? 'Guardar cambios' : 'Guardar producto'}
                    </button>
                </>
            }
        >
            <form id="product-form" onSubmit={handleSubmit} className="space-y-4 pb-2">
                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-nido-terracotta-border bg-nido-terracotta-bg p-3 text-xs text-nido-terracotta-text">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div>
                    <label htmlFor="product-name" className="mb-1 block text-xs font-medium text-nido-ink">
                        Nombre
                    </label>
                    <input
                        id="product-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Harina 0000"
                        className={inputClasses}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="product-category" className="mb-1 block text-xs font-medium text-nido-ink">
                            Categoría
                        </label>
                        <input
                            id="product-category"
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Ej. Despensa"
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label htmlFor="product-unit" className="mb-1 block text-xs font-medium text-nido-ink">
                            Unidad
                        </label>
                        <select
                            id="product-unit"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value as ProductUnit)}
                            className={inputClasses}
                        >
                            {PRODUCT_UNITS.map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label htmlFor="product-stock" className="mb-1 block text-xs font-medium text-nido-ink">
                            Stock actual
                        </label>
                        <input
                            id="product-stock"
                            type="number"
                            min="0"
                            value={currentStock}
                            onChange={(e) => setCurrentStock(e.target.value)}
                            disabled={isEdit}
                            className={`${inputClasses} disabled:cursor-not-allowed disabled:bg-nido-bg disabled:text-nido-subtle`}
                        />
                    </div>
                    <div>
                        <label htmlFor="product-min" className="mb-1 block text-xs font-medium text-nido-ink">
                            Stock mínimo
                        </label>
                        <input
                            id="product-min"
                            type="number"
                            min="0"
                            value={minStock}
                            onChange={(e) => setMinStock(e.target.value)}
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label htmlFor="product-reorder" className="mb-1 block text-xs font-medium text-nido-ink">
                            Reposición
                        </label>
                        <input
                            id="product-reorder"
                            type="number"
                            min="0"
                            value={reorderQuantity}
                            onChange={(e) => setReorderQuantity(e.target.value)}
                            placeholder="Auto"
                            className={inputClasses}
                        />
                    </div>
                </div>
                <p className="-mt-2 text-[11px] text-nido-subtle">
                    Si no definís reposición sugerida, se calcula como <em>mínimo − stock actual</em>.
                </p>

                <fieldset>
                    <legend className="mb-1.5 block text-xs font-medium text-nido-ink">Contenedores</legend>
                    <div className="flex flex-wrap gap-1.5">
                        {MOCK_CONTAINER_NAMES.map((container) => {
                            const checked = containers.includes(container);
                            return (
                                <button
                                    key={container}
                                    type="button"
                                    aria-pressed={checked}
                                    onClick={() => toggleContainer(container)}
                                    className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                                        checked
                                            ? 'bg-nido-olive font-semibold text-white'
                                            : 'border border-nido-border bg-nido-surface text-nido-secondary hover:text-nido-ink'
                                    }`}
                                >
                                    {container}
                                </button>
                            );
                        })}
                    </div>
                </fieldset>
            </form>
        </Modal>
    );
};
