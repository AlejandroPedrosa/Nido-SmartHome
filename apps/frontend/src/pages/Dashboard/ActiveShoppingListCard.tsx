import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { PackageCheck, ShoppingBag } from 'lucide-react';

interface ActiveShoppingListCardProps {
    /** `null` cuando no hay lista activa (no hay faltantes). */
    list: { purchasedCount: number; totalCount: number } | null;
}

export const ActiveShoppingListCard: FC<ActiveShoppingListCardProps> = ({ list }) => {
    const progress = list && list.totalCount > 0 ? Math.round((list.purchasedCount / list.totalCount) * 100) : 0;

    return (
        <section className="rounded-2xl border border-nido-border bg-nido-surface p-6">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-nido-ink">Lista de compras activa</h2>
                <ShoppingBag className="h-4 w-4 text-nido-subtle" />
            </div>

            {list ? (
                <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-medium text-nido-ink">
                            {list.purchasedCount} de {list.totalCount} comprados
                        </span>
                        <span className="text-[11px] font-semibold text-nido-muted">{progress}%</span>
                    </div>
                    <div
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-2 w-full overflow-hidden rounded-full bg-nido-olive-soft"
                    >
                        <div className="h-full rounded-full bg-nido-olive transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <Link
                        to="/shopping-list"
                        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-nido-border bg-nido-card-alt py-2 text-xs font-semibold text-nido-ink transition-colors hover:border-nido-olive hover:bg-nido-surface"
                    >
                        Ir a la lista
                    </Link>
                </div>
            ) : (
                <div className="py-2 text-center">
                    <PackageCheck className="mx-auto h-6 w-6 text-nido-sage-text" />
                    <p className="mt-2 text-xs font-semibold text-nido-ink">Sin lista activa</p>
                    <p className="mt-0.5 text-[11px] text-nido-muted">No hay productos por reponer.</p>
                </div>
            )}
        </section>
    );
};
