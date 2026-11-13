import { useEffect, useState, type FC, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ApiError } from '@/lib/api';
import { useContainersStore } from '@/stores/useContainersStore';
import { useProductsStore } from '@/stores/useProductsStore';
import type {
  CreateProductPayload,
  ProductDetail,
  ProductUnit,
  UpdateProductPayload,
} from '@/types';

const PRODUCT_UNITS: ProductUnit[] = ['unidad', 'g', 'kg', 'ml', 'l', 'paquete', 'botella'];

const inputClasses =
  'w-full rounded-xl border border-nido-border-strong bg-nido-surface px-3.5 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none';

interface ProductFormProps {
  /** Si viene, el modal funciona en modo edición (el stock no se edita, solo se ajusta). */
  product?: ProductDetail;
  /** Nombres ya usados, para validar unicidad en cliente antes del 409 de la API. */
  existingNames?: string[];
  onSuccess: () => void;
  onClose: () => void;
}

export const ProductForm: FC<ProductFormProps> = ({
  product,
  existingNames = [],
  onSuccess,
  onClose,
}) => {
  const isEdit = product !== undefined;
  const containers = useContainersStore((s) => s.containers);
  const fetchContainers = useContainersStore((s) => s.fetchContainers);
  const createProduct = useProductsStore((s) => s.createProduct);
  const updateProduct = useProductsStore((s) => s.updateProduct);

  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [unit, setUnit] = useState<ProductUnit>(product?.unit ?? 'unidad');
  const [currentStock, setCurrentStock] = useState(String(product?.current_stock ?? 0));
  const [minStock, setMinStock] = useState(String(product?.min_stock ?? 0));
  const [reorderQuantity, setReorderQuantity] = useState(
    product?.reorder_quantity != null ? String(product.reorder_quantity) : '',
  );
  const [containerIds, setContainerIds] = useState<string[]>(
    () => product?.containers.map((c) => c.id) ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (containers.length === 0) {
      void fetchContainers();
    }
  }, [containers.length, fetchContainers]);

  const toggleContainer = (id: string) => {
    setContainerIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
      setError('Ya existe un producto con ese nombre.');
      return;
    }

    const reorder = reorderQuantity.trim() === '' ? null : Number(reorderQuantity);
    if (reorder !== null && !(reorder > 0)) {
      setError('La reposición sugerida debe ser mayor a 0 o quedar vacía.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit && product) {
        const payload: UpdateProductPayload = {
          name: trimmed,
          category: category.trim() || null,
          unit,
          min_stock: Math.max(0, Number(minStock) || 0),
          reorder_quantity: reorder,
          container_ids: containerIds,
        };
        await updateProduct(product.id, payload);
      } else {
        const payload: CreateProductPayload = {
          name: trimmed,
          category: category.trim() || null,
          unit,
          current_stock: Math.max(0, Number(currentStock) || 0),
          min_stock: Math.max(0, Number(minStock) || 0),
          reorder_quantity: reorder,
          container_ids: containerIds,
        };
        await createProduct(payload);
      }
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setError(err.message || 'Ya existe un producto con ese nombre.');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('No se pudo guardar el producto. Intentá de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white hover:bg-nido-olive-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Guardar producto'}
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
          {containers.length === 0 ? (
            <p className="text-xs text-nido-subtle">No hay contenedores creados todavía.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {containers.map((container) => {
                const checked = containerIds.includes(container.id);
                return (
                  <button
                    key={container.id}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => toggleContainer(container.id)}
                    className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                      checked
                        ? 'bg-nido-olive font-semibold text-white'
                        : 'border border-nido-border bg-nido-surface text-nido-secondary hover:text-nido-ink'
                    }`}
                  >
                    {container.name}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>
      </form>
    </Modal>
  );
};
