import { useState, type FC, type FormEvent } from 'react';
import { AlertCircle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ApiError } from '@/lib/api';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { useProductsStore } from '@/stores/useProductsStore';
import type { Product } from '@/types';

interface StockAdjusterProps {
  product: Product;
  onSuccess: () => void;
  onClose: () => void;
}

export const StockAdjuster: FC<StockAdjusterProps> = ({ product, onSuccess, onClose }) => {
  const adjust = useInventoryStore((s) => s.adjust);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amount = Number(quantity) || 0;
  const delta = direction === 'in' ? amount : -amount;
  const resulting = product.current_stock + delta;
  const isNegative = resulting < 0;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!(amount > 0)) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }
    if (isNegative) {
      setError('El ajuste dejaría el stock en negativo.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await adjust({
        product_id: product.id,
        quantity_change: delta,
        reason: reason.trim() || undefined,
      });
      await fetchProducts();
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('No se pudo registrar el ajuste. Intentá de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Ajustar stock"
      subtitle={`${product.name} · actual: ${product.current_stock} ${product.unit}`}
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
            form="stock-adjuster-form"
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white hover:bg-nido-olive-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Registrando…' : 'Registrar ajuste'}
          </button>
        </>
      }
    >
      <form id="stock-adjuster-form" onSubmit={handleSubmit} className="space-y-4 pb-2">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-nido-terracotta-border bg-nido-terracotta-bg p-3 text-xs text-nido-terracotta-text">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={direction === 'in'}
            onClick={() => setDirection('in')}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
              direction === 'in'
                ? 'border-nido-sage-text/30 bg-nido-sage-bg text-nido-sage-text'
                : 'border-nido-border bg-nido-surface text-nido-secondary hover:text-nido-ink'
            }`}
          >
            <ArrowDownToLine className="h-4 w-4" />
            Entrada (+)
          </button>
          <button
            type="button"
            aria-pressed={direction === 'out'}
            onClick={() => setDirection('out')}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
              direction === 'out'
                ? 'border-nido-terracotta-border bg-nido-terracotta-bg text-nido-terracotta-text'
                : 'border-nido-border bg-nido-surface text-nido-secondary hover:text-nido-ink'
            }`}
          >
            <ArrowUpFromLine className="h-4 w-4" />
            Salida (−)
          </button>
        </div>

        <div>
          <label htmlFor="adjust-quantity" className="mb-1 block text-xs font-medium text-nido-ink">
            Cantidad ({product.unit})
          </label>
          <input
            id="adjust-quantity"
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-xl border border-nido-border-strong px-3.5 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="adjust-reason" className="mb-1 block text-xs font-medium text-nido-ink">
            Motivo <span className="font-normal text-nido-subtle">(opcional)</span>
          </label>
          <input
            id="adjust-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            placeholder="Ej. Se venció, regalo, conteo físico..."
            className="w-full rounded-xl border border-nido-border-strong px-3.5 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
          />
        </div>

        <div
          className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs ${
            isNegative
              ? 'bg-nido-terracotta-bg text-nido-terracotta-text'
              : 'bg-nido-card-alt text-nido-secondary'
          }`}
        >
          <span>Stock resultante</span>
          <span className="font-semibold">
            {resulting} {product.unit}
          </span>
        </div>
      </form>
    </Modal>
  );
};
