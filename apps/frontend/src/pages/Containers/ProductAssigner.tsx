import { useState, type FC } from 'react';
import { Check, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { Product } from '@/types';

interface ProductAssignerProps {
  containerName: string;
  /** Catálogo completo de productos del usuario. */
  products: Product[];
  /** Ids ya asignados al contenedor. */
  assignedIds: string[];
  /** Recibe los ids que quedan asignados (vincula y desvincula en una sola operación). */
  onSave: (assignedIds: string[]) => Promise<void>;
  onClose: () => void;
}

export const ProductAssigner: FC<ProductAssignerProps> = ({
  containerName,
  products,
  assignedIds,
  onSave,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(() => assignedIds);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(selectedIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la asignación.');
      setIsSaving(false);
    }
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
            disabled={isSaving}
            className="cursor-pointer rounded-xl border border-nido-border px-4 py-2 text-xs font-medium text-nido-secondary hover:bg-nido-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="cursor-pointer rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white hover:bg-nido-olive-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Guardando…' : 'Guardar asignación'}
          </button>
        </>
      }
    >
      <div className="space-y-3 pb-2">
        {error && (
          <p className="rounded-xl border border-nido-terracotta-border bg-nido-terracotta-bg px-3 py-2 text-xs text-nido-terracotta-text">
            {error}
          </p>
        )}

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
                      {product.category || 'Sin categoría'} · stock {product.current_stock} {product.unit}
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
