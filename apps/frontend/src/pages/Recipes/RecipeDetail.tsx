import type { FC } from 'react';
import { AlertCircle, CheckCircle2, ChefHat, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { RecipeDetail as RecipeDetailType } from '@/types';

interface RecipeDetailProps {
  recipe: RecipeDetailType;
  isLoading?: boolean;
  onCook: () => void;
  onClose: () => void;
}

export const RecipeDetail: FC<RecipeDetailProps> = ({ recipe, isLoading = false, onCook, onClose }) => {
  const steps = (recipe.instructions ?? '')
    .split('\n')
    .map((step) => step.trim())
    .filter(Boolean);

  return (
    <Modal
      title={recipe.name}
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
            onClick={onCook}
            disabled={!recipe.can_cook || isLoading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              recipe.can_cook && !isLoading
                ? 'cursor-pointer bg-nido-olive text-white hover:bg-nido-olive-hover'
                : 'cursor-not-allowed border border-nido-border bg-nido-bg text-nido-subtle'
            }`}
          >
            <ChefHat className="h-4 w-4" />
            Cocinar receta
          </button>
        </>
      }
    >
      <div className="space-y-5 pb-2">
        {isLoading ? (
          <p className="py-10 text-center text-xs text-nido-subtle">Cargando detalle…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-4 text-xs text-nido-muted">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-nido-subtle" />
                {recipe.servings} {recipe.servings === 1 ? 'porción' : 'porciones'}
              </span>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold text-nido-ink">Ingredientes</h3>
              <div className="overflow-hidden rounded-xl border border-nido-border">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-nido-border bg-nido-card-alt text-[11px] font-semibold tracking-wider text-nido-subtle uppercase">
                      <th className="px-4 py-2.5">Ingrediente</th>
                      <th className="px-4 py-2.5">Requerido</th>
                      <th className="px-4 py-2.5">En stock</th>
                      <th className="px-4 py-2.5">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-nido-border">
                    {recipe.ingredients.map((ingredient) => (
                      <tr key={ingredient.product_id}>
                        <td className="px-4 py-2.5 font-semibold text-nido-ink">
                          {ingredient.product_name}
                        </td>
                        <td className="px-4 py-2.5 text-nido-secondary">
                          {ingredient.quantity} {ingredient.unit}
                        </td>
                        <td
                          className={`px-4 py-2.5 font-semibold ${
                            ingredient.available ? 'text-nido-ink' : 'text-nido-terracotta-text'
                          }`}
                        >
                          {ingredient.current_stock} {ingredient.unit}
                        </td>
                        <td className="px-4 py-2.5">
                          {ingredient.available ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-nido-sage-bg px-2.5 py-1 text-[11px] font-semibold text-nido-sage-text">
                              <CheckCircle2 className="h-3 w-3" />
                              Disponible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-nido-terracotta-bg px-2.5 py-1 text-[11px] font-semibold text-nido-terracotta-text">
                              <AlertCircle className="h-3 w-3" />
                              Faltan{' '}
                              {Number((ingredient.quantity - ingredient.current_stock).toFixed(3))}{' '}
                              {ingredient.unit}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold text-nido-ink">Instrucciones</h3>
              {steps.length === 0 ? (
                <p className="text-xs text-nido-subtle">Esta receta no tiene instrucciones cargadas.</p>
              ) : (
                <ol className="space-y-2.5">
                  {steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3 text-xs text-nido-secondary">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-nido-olive-soft text-[11px] font-semibold text-nido-olive">
                        {index + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
