import { useState, type FC, type FormEvent } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ApiError } from '@/lib/api';
import type { CreateRecipePayload, Product, RecipeDetail, RecipeIngredientPayload } from '@/types';

export type RecipeFormValues = CreateRecipePayload;

interface RecipeFormProps {
  /** Si viene, el modal funciona en modo edición. */
  recipe?: RecipeDetail | null;
  /** Catálogo propio del usuario: los ingredientes solo pueden ser sus productos (RC-01). */
  products: Product[];
  onSubmit: (values: RecipeFormValues) => Promise<void>;
  onClose: () => void;
}

interface IngredientRow {
  key: string;
  product_id: string;
  quantity: string;
}

const inputClasses =
  'w-full rounded-xl border border-nido-border-strong bg-nido-surface px-3.5 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none';

let rowCounter = 0;
const newRowKey = () => `row-${++rowCounter}`;

function toRows(recipe?: RecipeDetail | null): IngredientRow[] {
  if (recipe?.ingredients?.length) {
    return recipe.ingredients.map((i) => ({
      key: newRowKey(),
      product_id: i.product_id,
      quantity: String(i.quantity),
    }));
  }
  return [{ key: newRowKey(), product_id: '', quantity: '' }];
}

export const RecipeForm: FC<RecipeFormProps> = ({ recipe, products, onSubmit, onClose }) => {
  const isEdit = recipe != null;

  const [name, setName] = useState(recipe?.name ?? '');
  const [servings, setServings] = useState(String(recipe?.servings ?? 2));
  const [instructions, setInstructions] = useState(recipe?.instructions ?? '');
  const [rows, setRows] = useState<IngredientRow[]>(() => toRows(recipe));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const updateRow = (key: string, patch: Partial<IngredientRow>) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((row) => row.key !== key));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { key: newRowKey(), product_id: '', quantity: '' }]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError('El nombre es obligatorio.');
      return;
    }

    const servingsNumber = Number(servings);
    if (!Number.isInteger(servingsNumber) || servingsNumber < 1 || servingsNumber > 100) {
      setError('Las porciones deben ser un entero entre 1 y 100.');
      return;
    }

    const filled = rows.filter((row) => row.product_id !== '' || row.quantity !== '');
    if (filled.length === 0) {
      setError('La receta debe tener al menos un ingrediente.');
      return;
    }
    if (filled.some((row) => row.product_id === '' || !(Number(row.quantity) > 0))) {
      setError('Cada ingrediente necesita un producto y una cantidad mayor a 0.');
      return;
    }
    if (new Set(filled.map((row) => row.product_id)).size !== filled.length) {
      setError('Un producto no puede repetirse en los ingredientes.');
      return;
    }

    const ingredients: RecipeIngredientPayload[] = filled.map((row) => ({
      product_id: row.product_id,
      quantity: Number(row.quantity),
    }));

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: trimmed,
        servings: servingsNumber,
        instructions: instructions.trim() || null,
        ingredients,
      });
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setError(err.message || 'Ya existe una receta con ese nombre.');
      } else {
        setError(err instanceof Error ? err.message : 'No se pudo guardar la receta.');
      }
    } finally {
      setIsSaving(false);
    }
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
            disabled={isSaving}
            className="cursor-pointer rounded-xl border border-nido-border px-4 py-2 text-xs font-medium text-nido-secondary hover:bg-nido-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="recipe-form"
            disabled={isSaving}
            className="cursor-pointer rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white hover:bg-nido-olive-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar receta'}
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
            placeholder={'Pelá las papas\nHervilas 20 minutos...'}
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
              const selected = products.find((p) => p.id === row.product_id);
              const usedByOthers = rows
                .filter((other) => other.key !== row.key)
                .map((other) => other.product_id);

              return (
                <div key={row.key} className="flex items-center gap-2">
                  <select
                    value={row.product_id}
                    onChange={(e) => updateRow(row.key, { product_id: e.target.value })}
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
