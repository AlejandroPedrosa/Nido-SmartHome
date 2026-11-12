import type { FC } from 'react';
import { AlertCircle, ChefHat } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { MissingIngredient, RecipeDetail, RecipeIngredient } from '@/types';

interface CookConfirmProps {
  recipe: RecipeDetail;
  ingredients: RecipeIngredient[];
  /** Mensaje general del HTTP 400 cuando el stock no alcanza. */
  error?: string | null;
  /** Lista de faltantes cuando ApiError 400 trae `missing`. */
  missing?: MissingIngredient[] | null;
  isConfirming?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const CookConfirm: FC<CookConfirmProps> = ({
  recipe,
  ingredients,
  error,
  missing,
  isConfirming = false,
  onConfirm,
  onClose,
}) => {
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
            disabled={isConfirming}
            className="cursor-pointer rounded-xl border border-nido-border px-4 py-2 text-xs font-medium text-nido-secondary hover:bg-nido-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white hover:bg-nido-olive-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ChefHat className="h-4 w-4" />
            {isConfirming ? 'Cocinando…' : 'Confirmar y descontar'}
          </button>
        </>
      }
    >
      <div className="space-y-4 pb-2">
        {(error || (missing && missing.length > 0)) && (
          <div className="space-y-2 rounded-xl border border-nido-terracotta-border bg-nido-terracotta-bg p-3 text-xs text-nido-terracotta-text">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error ?? 'Stock insuficiente. No se descontó nada.'}</span>
            </div>
            {missing && missing.length > 0 && (
              <ul className="ml-6 list-disc space-y-1">
                {missing.map((item) => (
                  <li key={item.product_id}>
                    {item.product_name}: necesita {item.required} {item.unit}, hay {item.available}{' '}
                    {item.unit}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="text-xs leading-relaxed text-nido-secondary">
          Se van a descontar estos insumos del inventario en una sola operación. Si alguno no alcanza, no se
          descuenta nada.
        </p>

        <ul className="divide-y divide-nido-border overflow-hidden rounded-xl border border-nido-border text-xs">
          {ingredients.map((ingredient) => (
            <li
              key={ingredient.product_id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-semibold text-nido-ink">{ingredient.product_name}</p>
                <p className="text-[11px] text-nido-subtle">
                  Quedan{' '}
                  {Number((ingredient.current_stock - ingredient.quantity).toFixed(3))}{' '}
                  {ingredient.unit}
                </p>
              </div>
              <span className="rounded-lg bg-nido-terracotta-bg px-2.5 py-1 text-[11px] font-semibold text-nido-terracotta-text">
                −{ingredient.quantity} {ingredient.unit}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
};
