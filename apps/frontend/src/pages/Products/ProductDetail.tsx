import type { FC } from 'react';
import { Modal } from '@/components/ui/Modal';
import { StockBadge } from '@/components/ui/StockBadge';
import {
    formatMovementDate,
    getStockStatus,
    MOVEMENT_TYPE_LABELS,
    type MovementMock,
    type ProductMock,
} from '@/mocks/inventory';

interface ProductDetailProps {
    product: ProductMock;
    /** Movimientos del producto, ya filtrados y ordenados del más nuevo al más viejo. */
    movements: MovementMock[];
    onClose: () => void;
}

export const ProductDetail: FC<ProductDetailProps> = ({ product, movements, onClose }) => {
    const status = getStockStatus(product.currentStock, product.minStock);

    return (
        <Modal
            title={product.name}
            subtitle={product.category || 'Sin categoría'}
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
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-nido-border bg-nido-card-alt p-3">
                        <dt className="text-[11px] text-nido-subtle">Stock actual</dt>
                        <dd className="mt-1 text-sm font-bold text-nido-ink">
                            {product.currentStock} {product.unit}
                        </dd>
                    </div>
                    <div className="rounded-xl border border-nido-border bg-nido-card-alt p-3">
                        <dt className="text-[11px] text-nido-subtle">Stock mínimo</dt>
                        <dd className="mt-1 text-sm font-bold text-nido-ink">
                            {product.minStock} {product.unit}
                        </dd>
                    </div>
                    <div className="rounded-xl border border-nido-border bg-nido-card-alt p-3">
                        <dt className="text-[11px] text-nido-subtle">Reposición sugerida</dt>
                        <dd className="mt-1 text-sm font-bold text-nido-ink">
                            {product.reorderQuantity ?? Math.max(0, product.minStock - product.currentStock)}{' '}
                            {product.unit}
                        </dd>
                    </div>
                    <div className="rounded-xl border border-nido-border bg-nido-card-alt p-3">
                        <dt className="text-[11px] text-nido-subtle">Estado</dt>
                        <dd className="mt-1">
                            <StockBadge status={status} />
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
                                    key={container}
                                    className="rounded-lg border border-nido-border bg-nido-card-alt px-2.5 py-1 text-[11px] font-medium text-nido-secondary"
                                >
                                    {container}
                                </span>
                            ))
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="mb-2 text-xs font-bold text-nido-ink">Historial de movimientos</h3>
                    {movements.length === 0 ? (
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
                                    {movements.map((movement) => {
                                        const isPositive = movement.quantity > 0;
                                        return (
                                            <tr key={movement.id}>
                                                <td className="px-4 py-2.5 whitespace-nowrap text-nido-secondary">
                                                    {formatMovementDate(movement.createdAt)}
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
                                                        {movement.quantity} {product.unit}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-nido-secondary">
                                                    {MOVEMENT_TYPE_LABELS[movement.type]}
                                                </td>
                                                <td className="px-4 py-2.5 text-nido-muted">
                                                    {movement.reason ?? '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
