import { useState, type FC, type FormEvent } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { ProductMock } from '@/mocks/inventory';
import type { RecipeIngredientMock, RecipeMock } from '@/mocks/recipes';

export interface RecipeFormValues {
    name: string;
    servings: number;
    instructions: string;
    ingredients: RecipeIngredientMock[];
}

interface RecipeFormProps {
    /** Si viene, el modal funciona en modo edición. */
    recipe?: RecipeMock;
    /** Catálogo propio del usuario: los ingredientes solo pueden ser sus productos (RC-01). */
    products: ProductMock[];
    /** Nombres ya usados, para simular el 409 de unicidad (UG-01). */
    existingNames: string[];
    onSubmit: (values: RecipeFormValues) => void;
    onClose: () => void;
}

interface IngredientRow {
    key: string;
    productId: string;
    quantity: string;
}

const inputClasses =
    'w-full rounded-xl border border-nido-border-strong bg-nido-surface px-3.5 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none';

let rowCounter = 0;
const newRowKey = () => `row-${++rowCounter}`;

export const RecipeForm: FC<RecipeFormProps> = ({ recipe, products, existingNames, onSubmit, onClose }) => {
    const isEdit = recipe !== undefined;

    const [name, setName] = useState(recipe?.name ?? '');
    const [servings, setServings] = useState(String(recipe?.servings ?? 2));
    const [instructions, setInstructions] = useState(recipe?.instructions ?? '');
    const [rows, setRows] = useState<IngredientRow[]>(
        recipe?.ingredients.map((i) => ({ key: newRowKey(), productId: i.productId, quantity: String(i.quantity) })) ?? [
            { key: newRowKey(), productId: '', quantity: '' },
        ],
    );
    const [error, setError] = useState<string | null>(null);

    const updateRow = (key: string, patch: Partial<IngredientRow>) => {
        setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    };

    const removeRow = (key: string) => {
        setRows((prev) => prev.filter((row) => row.key !== key));
    };

    const addRow = () => {
        setRows((prev) => [...prev, { key: newRowKey(), productId: '', quantity: '' }]);
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
                existing.trim().toLowerCase() !== recipe?.name.trim().toLowerCase(),
        );
        if (isDuplicate) {
            setError('Ya existe una receta con ese nombre (HTTP 409).');
            return;
        }

        const servingsNumber = Number(servings);
        if (!Number.isInteger(servingsNumber) || servingsNumber < 1 || servingsNumber > 100) {
            setError('Las porciones deben ser un entero entre 1 y 100.');
            return;
        }

        const filled = rows.filter((row) => row.productId !== '' || row.quantity !== '');
        if (filled.length === 0) {
            setError('La receta debe tener al menos un ingrediente (HTTP 400).');
            return;
        }
        if (filled.some((row) => row.productId === '' || !(Number(row.quantity) > 0))) {
            setError('Cada ingrediente necesita un producto y una cantidad mayor a 0.');
            return;
        }
        if (new Set(filled.map((row) => row.productId)).size !== filled.length) {
            setError('Un producto no puede repetirse en los ingredientes.');
            return;
        }

        onSubmit({
            name: trimmed,
            servings: servingsNumber,
            instructions: instructions.trim(),
            ingredients: filled.map((row) => ({ productId: row.productId, quantity: Number(row.quantity) })),
        });
    };

    return (
        <Modal
            title={isEdit ? 'Editar receta' : 'Nueva receta'}
            subtitle="Los ingredientes salen de tu inventario y cocinar descuenta estas cantidades."
            size="lg"
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
                        form="recipe-form"
                        className="cursor-pointer rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white hover:bg-nido-olive-hover"
                    >
                        {isEdit ? 'Guardar cambios' : 'Guardar receta'}
                    </button>
                </>
            }
        >
            <form id="recipe-form" onSubmit={handleSubmit} className="space-y-4 pb-2">
                {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-nido-terracotta-border bg-nido-terracotta-bg p-3 text-xs text-nido-terracotta-text">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem]">
                    <div>
                        <label htmlFor="recipe-name" className="mb-1 block text-xs font-medium text-nido-ink">
                            Nombre
                        </label>
                        <input
                            id="recipe-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={100}
                            placeholder="Ej. Milanesas con puré"
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label htmlFor="recipe-servings" className="mb-1 block text-xs font-medium text-nido-ink">
                            Porciones
                        </label>
                        <input
                            id="recipe-servings"
                            type="number"
                            min="1"
                            max="100"
                            value={servings}
                            onChange={(e) => setServings(e.target.value)}
                            className={inputClasses}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="recipe-instructions" className="mb-1 block text-xs font-medium text-nido-ink">
                        Instrucciones <span className="font-normal text-nido-subtle">(un paso por línea)</span>
                    </label>
                    <textarea
                        id="recipe-instructions"
                        rows={4}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        maxLength={5000}
                        placeholder="Pelá las papas&#10;Hervilas 20 minutos..."
                        className={`${inputClasses} resize-y`}
                    />
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-xs font-medium text-nido-ink">Ingredientes</h3>
                        <button
                            type="button"
                            onClick={addRow}
                            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-nido-olive hover:underline"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Agregar ingrediente
                        </button>
                    </div>

                    <div className="space-y-2">
                        {rows.map((row, index) => {
                            const selected = products.find((p) => p.id === row.productId);
                            const usedByOthers = rows
                                .filter((other) => other.key !== row.key)
                                .map((other) => other.productId);

                            return (
                                <div key={row.key} className="flex items-center gap-2">
                                    <select
                                        value={row.productId}
                                        onChange={(e) => updateRow(row.key, { productId: e.target.value })}
                                        aria-label={`Producto del ingrediente ${index + 1}`}
                                        className={`${inputClasses} flex-1`}
                                    >
                                        <option value="">Elegí un producto...</option>
                                        {products.map((product) => (
                                            <option
                                                key={product.id}
                                                value={product.id}
                                                disabled={usedByOthers.includes(product.id)}
                                            >
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>

                                    <div className="relative w-32 shrink-0">
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={row.quantity}
                                            onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                                            aria-label={`Cantidad del ingrediente ${index + 1}`}
                                            placeholder="Cantidad"
                                            className={`${inputClasses} pr-12`}
                                        />
                                        {selected && (
                                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-nido-subtle">
                                                {selected.unit}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeRow(row.key)}
                                        aria-label={`Quitar ingrediente ${index + 1}`}
                                        className="cursor-pointer rounded-lg p-1.5 text-nido-subtle transition-colors hover:bg-nido-terracotta-bg hover:text-nido-terracotta-text"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </form>
        </Modal>
    );
};
