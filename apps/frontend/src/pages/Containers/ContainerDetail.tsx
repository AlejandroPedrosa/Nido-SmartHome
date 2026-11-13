import type { FC } from 'react';
import { Link2Off, PackagePlus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { StockBadge } from '@/components/ui/StockBadge';
import type { Product } from '@/types';

interface ContainerDetailProps {
  name: string;
  products: Product[];
  isLoading?: boolean;
  onAssign: () => void;
  onUnassign: (productId: string) => void;
  onClose: () => void;
}

export const ContainerDetail: FC<ContainerDetailProps> = ({
  name,
  products,
  isLoading = false,
  onAssign,
  onUnassign,
  onClose,
}) => {
  return (
    <Modal
      title={name}
      subtitle={`${products.length} productos asignados a este espacio`}
      size="lg"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-nido-border px-4 py-2 text-xs font-medium text-nido-secondary hover:bg-nido-bg"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={onAssign}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white hover:bg-nido-olive-hover"
          >
            <PackagePlus className="h-4 w-4" />
            Asignar productos
          </button>
        </>
      }
    >
      <div className="pb-2">
        {isLoading ? (
          <p className="py-10 text-center text-xs text-nido-subtle">Cargando productos…</p>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-nido-border-strong px-6 py-10 text-center">
            <PackagePlus className="mx-auto h-8 w-8 text-nido-subtle" />
            <p className="mt-3 text-sm font-semibold text-nido-ink">Este espacio está vacío</p>
            <p className="mt-1 text-xs text-nido-muted">
              Asigná productos existentes del inventario para organizarlos acá.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-nido-border">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-nido-border bg-nido-card-alt text-[11px] font-semibold tracking-wider text-nido-subtle uppercase">
                  <th className="px-4 py-2.5">Producto</th>
                  <th className="px-4 py-2.5">Stock</th>
                  <th className="px-4 py-2.5">Estado</th>
                  <th className="px-4 py-2.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nido-border">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-nido-ink">{product.name}</p>
                      <p className="text-[11px] text-nido-subtle">{product.category || 'Sin categoría'}</p>
                    </td>
                    <td className="px-4 py-3 text-nido-secondary">
                      {product.current_stock} {product.unit}
                      <span className="ml-1.5 text-[11px] text-nido-subtle">(mín. {product.min_stock})</span>
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge status={product.stock_status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onUnassign(product.id)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-nido-border px-2.5 py-1 text-[11px] font-medium text-nido-secondary transition-colors hover:border-nido-terracotta-border hover:bg-nido-terracotta-bg hover:text-nido-terracotta-text"
                      >
                        <Link2Off className="h-3 w-3" />
                        Desasignar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};
