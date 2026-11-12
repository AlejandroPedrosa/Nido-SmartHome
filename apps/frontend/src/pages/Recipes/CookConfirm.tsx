import type { FC } from 'react';
import { AlertCircle, ChefHat } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { IngredientStatus, RecipeMock } from '@/mocks/recipes';

interface CookConfirmProps {
    recipe: RecipeMock;
    ingredients: IngredientStatus[];
    /** Mensaje del HTTP 400 cuando el stock cambió y ya no alcanza (RS-04). */
    error?: string | null;
    onConfirm: () => void;
    onClose: () => void;
}

export const CookConfirm: FC<CookConfirmProps> = ({ recipe, ingredients, error, onConfirm, onClose }) => {
    return (
        <Modal
            title="Cocinar receta"
            subtitle={recipe.name}
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
                        type="button"
                        onClick={onConfirm}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white hover:bg-nido-olive-hover"
                    >
                        <ChefHat className="h-4 w-4" />
                        Confirmar y descontar
                    </button>
                </>
            }
        >
            <div className="space-y-4 pb-2">
                {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-nido-terracotta-border bg-nido-terracotta-bg p-3 text-xs text-nido-terracotta-text">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <p className="text-xs leading-relaxed text-nido-secondary">
                    Se van a descontar estos insumos del inventario en una sola operación. Si alguno no alcanza, no se
                    descuenta nada.
                </p>

                <ul className="divide-y divide-nido-border overflow-hidden rounded-xl border border-nido-border text-xs">
                    {ingredients.map(({ product, required }) => (
                        <li key={product.id} className="flex items-center justify-between gap-3 px-4 py-3">
                            <div>
                                <p className="font-semibold text-nido-ink">{product.name}</p>
                                <p className="text-[11px] text-nido-subtle">
                                    Quedan {Number((product.currentStock - required).toFixed(3))} {product.unit}
                                </p>
                            </div>
                            <span className="rounded-lg bg-nido-terracotta-bg px-2.5 py-1 text-[11px] font-semibold text-nido-terracotta-text">
                                −{required} {product.unit}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </Modal>
    );
};
