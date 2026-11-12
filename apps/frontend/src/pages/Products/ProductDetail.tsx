import { useEffect, useState, type FC } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { StockBadge } from '@/components/ui/StockBadge';
import { ApiError } from '@/lib/api';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { useProductsStore } from '@/stores/useProductsStore';
import type { MovementType, ProductDetail as ProductDetailType } from '@/types';

const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  manual: 'Manual',
  recipe_consumption: 'Receta',
  shopping: 'Compra',
};

const formatMovementDate = (iso: string): string =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

interface ProductDetailProps {
  productId: string;
  onClose: () => void;
}

export const ProductDetail: FC<ProductDetailProps> = ({ productId, onClose }) => {
  const fetchProductDetail = useProductsStore((s) => s.fetchProductDetail);
  const productMovements = useInventoryStore((s) => s.productMovements);
  const fetchProductMovements = useInventoryStore((s) => s.fetchProductMovements);
  const movementsLoading = useInventoryStore((s) => s.isLoading);

  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([fetchProductDetail(productId), fetchProductMovements(productId)])
      .then(([detail]) => {
        if (cancelled) return;
        setProduct(detail);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar el detalle del producto.');
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, fetchProductDetail, fetchProductMovements]);

  const suggestedReorder =
    product?.reorder_quantity ??
    (product ? Math.max(0, product.min_stock - product.current_stock) : 0);

  return (
    <Modal
      title={product?.name ?? 'Detalle de producto'}
      subtitle={product ? product.category || 'Sin categoría' : undefined}
      size="lg"
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-xl border border-nido-border px-4 py-2 text-xs font-medium text-nido-secondary hover:bg-nido-bg"
        >
          Cerrar
        </button>
      }
    >
      <div className="space-y-5 pb-2">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-nido-terracotta-border bg-nido-terracotta-bg p-3 text-xs text-nido-terracotta-text">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading && !product ? (
          <p className="py-8 text-center text-xs text-nido-subtle">Cargando detalle…</p>
        ) : product ? (
          <>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-nido-border bg-nido-card-alt p-3">
                <dt className="text-[11px] text-nido-subtle">Stock actual</dt>
                <dd className="mt-1 text-sm font-bold text-nido-ink">
                  {product.current_stock} {product.unit}
                </dd>
              </div>
              <div className="rounded-xl border border-nido-border bg-nido-card-alt p-3">
                <dt className="text-[11px] text-nido-subtle">Stock mínimo</dt>
                <dd className="mt-1 text-sm font-bold text-nido-ink">
                  {product.min_stock} {product.unit}
                </dd>
              </div>
              <div className="rounded-xl border border-nido-border bg-nido-card-alt p-3">
                <dt className="text-[11px] text-nido-subtle">Reposición sugerida</dt>
                <dd className="mt-1 text-sm font-bold text-nido-ink">
                  {suggestedReorder} {product.unit}
                </dd>
              </div>
              <div className="rounded-xl border border-nido-border bg-nido-card-alt p-3">
                <dt className="text-[11px] text-nido-subtle">Estado</dt>
                <dd className="mt-1">
                  <StockBadge status={product.stock_status} />
                </dd>
              </div>
            </dl>

            <div>
              <h3 className="mb-2 text-xs font-bold text-nido-ink">Contenedores</h3>
              <div className="flex flex-wrap gap-1.5">
                {product.containers.length === 0 ? (
                  <span className="text-xs text-nido-subtle">Sin contenedor asignado</span>
                ) : (
                  product.containers.map((container) => (
                    <span
                      key={container.id}
                      className="rounded-lg border border-nido-border bg-nido-card-alt px-2.5 py-1 text-[11px] font-medium text-nido-secondary"
                    >
                      {container.name}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold text-nido-ink">Historial de movimientos</h3>
              {movementsLoading && productMovements.length === 0 ? (
                <p className="rounded-xl border border-dashed border-nido-border-strong p-4 text-center text-xs text-nido-subtle">
                  Cargando movimientos…
                </p>
              ) : productMovements.length === 0 ? (
                <p className="rounded-xl border border-dashed border-nido-border-strong p-4 text-center text-xs text-nido-subtle">
                  Este producto todavía no tiene movimientos registrados.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-nido-border">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-nido-border bg-nido-card-alt text-[11px] font-semibold tracking-wider text-nido-subtle uppercase">
                        <th className="px-4 py-2.5">Fecha</th>
                        <th className="px-4 py-2.5">Variación</th>
                        <th className="px-4 py-2.5">Tipo</th>
                        <th className="px-4 py-2.5">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-nido-border">
                      {productMovements.map((movement) => {
                        const isPositive = movement.quantity_change > 0;
                        return (
                          <tr key={movement.id}>
                            <td className="px-4 py-2.5 whitespace-nowrap text-nido-secondary">
                              {formatMovementDate(movement.created_at)}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                                  isPositive
                                    ? 'bg-nido-sage-bg text-nido-sage-text'
                                    : 'bg-nido-terracotta-bg text-nido-terracotta-text'
                                }`}
                              >
                                {isPositive ? '+' : ''}
                                {movement.quantity_change} {product.unit}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-nido-secondary">
                              {MOVEMENT_TYPE_LABELS[movement.type]}
                            </td>
                            <td className="px-4 py-2.5 text-nido-muted">{movement.reason ?? '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
};
