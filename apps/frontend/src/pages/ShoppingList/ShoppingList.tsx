import { useEffect, useState, type FC } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  History,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useShoppingStore } from '@/stores/useShoppingStore';
import type { ShoppingListDetail, ShoppingListItem } from '@/types';

type Tab = 'active' | 'history';

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

export const ShoppingList: FC = () => {
  const activeList = useShoppingStore((s) => s.activeList);
  const lists = useShoppingStore((s) => s.lists);
  const historyDetail = useShoppingStore((s) => s.historyDetail);
  const isLoading = useShoppingStore((s) => s.isLoading);
  const storeError = useShoppingStore((s) => s.error);
  const notice = useShoppingStore((s) => s.notice);
  const loadActive = useShoppingStore((s) => s.loadActive);
  const generate = useShoppingStore((s) => s.generate);
  const setItemPurchased = useShoppingStore((s) => s.setItemPurchased);
  const removeItem = useShoppingStore((s) => s.removeItem);
  const purchase = useShoppingStore((s) => s.purchase);
  const loadHistoryDetail = useShoppingStore((s) => s.loadHistoryDetail);
  const fetchLists = useShoppingStore((s) => s.fetchLists);

  const [tab, setTab] = useState<Tab>('active');
  const [itemToRemove, setItemToRemove] = useState<ShoppingListItem | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    void loadActive();
  }, [loadActive]);

  const items = activeList?.items ?? [];
  const totalCount = activeList?.item_count ?? items.length;
  const purchasedCount = activeList?.purchased_count ?? items.filter((i) => i.purchased).length;
  const progress = totalCount === 0 ? 0 : Math.round((purchasedCount / totalCount) * 100);
  const purchasedItems = items.filter((i) => i.purchased);
  const closedLists = lists.filter((l) => l.is_purchased);

  const togglePurchased = async (productId: string, purchased: boolean) => {
    setActionError(null);
    try {
      await setItemPurchased(productId, !purchased);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo actualizar el ítem.');
    }
  };

  const handleConfirmRemove = async () => {
    if (!itemToRemove) return;
    setIsRemoving(true);
    setActionError(null);
    try {
      await removeItem(itemToRemove.product_id);
      setItemToRemove(null);
    } catch (err) {
      setItemToRemove(null);
      setActionError(err instanceof Error ? err.message : 'No se pudo quitar el ítem.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleSync = async () => {
    setActionError(null);
    await generate();
  };

  const handleConfirmPurchase = async () => {
    setIsPurchasing(true);
    setActionError(null);
    try {
      await purchase();
      setIsConfirmOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo confirmar la compra.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleExpandHistory = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    setActionError(null);
    try {
      await loadHistoryDetail(id);
    } catch (err) {
      setExpandedId(null);
      setActionError(err instanceof Error ? err.message : 'No se pudo cargar el detalle del historial.');
    }
  };

  const noticeTone =
    notice?.includes('Inventario completo') || notice?.includes('no hay productos')
      ? 'complete'
      : 'success';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-col justify-between gap-4 border-b border-nido-border bg-nido-surface px-6 py-4 sm:flex-row sm:items-center lg:px-8">
        <div>
          <h1 className="text-base font-bold text-nido-ink">Lista de Compras</h1>
          <p className="text-xs text-nido-subtle">
            {totalCount - purchasedCount} pendientes · {purchasedCount} marcados en el carrito
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={isLoading}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-nido-border bg-nido-surface px-3.5 py-2 text-xs font-medium text-nido-ink transition-colors hover:bg-nido-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-nido-secondary ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sincronizar faltantes</span>
          </button>

          <button
            type="button"
            disabled={purchasedCount === 0 || isLoading}
            onClick={() => setIsConfirmOpen(true)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
              purchasedCount > 0
                ? 'cursor-pointer bg-nido-olive text-white shadow-xs hover:bg-nido-olive-hover'
                : 'cursor-not-allowed border border-nido-border bg-nido-bg text-nido-subtle'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Confirmar compra ({purchasedCount})</span>
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl space-y-6 p-6 lg:p-8">
        {notice && (
          <div
            role="status"
            className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-medium ${
              noticeTone === 'complete'
                ? 'border-nido-border bg-nido-olive-soft text-nido-olive'
                : 'border-nido-sage-text/20 bg-nido-sage-bg text-nido-sage-text'
            }`}
          >
            {noticeTone === 'complete' ? (
              <PackageCheck className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>{notice}</span>
          </div>
        )}

        {(storeError || actionError) && (
          <div
            role="alert"
            className="rounded-2xl border border-nido-terracotta-border bg-nido-terracotta-bg px-4 py-3 text-xs font-medium text-nido-terracotta-text"
          >
            {actionError ?? storeError}
          </div>
        )}

        <div className="inline-flex items-center rounded-xl border border-nido-border bg-nido-surface p-1">
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'active' ? 'bg-nido-olive text-white' : 'text-nido-secondary hover:text-nido-ink'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Lista activa
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('history');
              void fetchLists();
            }}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === 'history' ? 'bg-nido-olive text-white' : 'text-nido-secondary hover:text-nido-ink'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Historial
            <span
              className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                tab === 'history' ? 'bg-white/20 text-white' : 'bg-nido-olive-soft text-nido-ink'
              }`}
            >
              {closedLists.length}
            </span>
          </button>
        </div>

        {tab === 'active' ? (
          <>
            {totalCount > 0 && (
              <div className="rounded-2xl border border-nido-border bg-nido-surface p-5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-nido-ink">
                    {purchasedCount} de {totalCount} productos comprados
                  </span>
                  <span className="font-semibold text-nido-muted">{progress}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2 w-full overflow-hidden rounded-full bg-nido-olive-soft"
                >
                  <div
                    className="h-full rounded-full bg-nido-olive transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {isLoading && !activeList ? (
              <p className="py-14 text-center text-xs text-nido-subtle">Cargando lista…</p>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-nido-border-strong bg-nido-surface px-6 py-14 text-center">
                <PackageCheck className="mx-auto h-8 w-8 text-nido-sage-text" />
                <p className="mt-3 text-sm font-semibold text-nido-ink">Inventario completo</p>
                <p className="mt-1 text-xs text-nido-muted">
                  No hay ítems en la lista. Usá &quot;Sincronizar faltantes&quot; para revisar si algún producto
                  cayó por debajo del mínimo.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-nido-border overflow-hidden rounded-2xl border border-nido-border bg-nido-surface">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className={`flex items-center justify-between gap-4 px-5 py-4 transition-colors ${
                      item.purchased ? 'bg-nido-card-alt/70' : 'hover:bg-nido-bg/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <button
                        type="button"
                        onClick={() => void togglePurchased(item.product_id, item.purchased)}
                        aria-label={`Marcar ${item.product_name}`}
                        aria-pressed={item.purchased}
                        className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors ${
                          item.purchased
                            ? 'border-nido-olive bg-nido-olive text-white'
                            : 'border-nido-border-strong bg-nido-surface hover:border-nido-olive'
                        }`}
                      >
                        {item.purchased && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            item.purchased ? 'text-nido-subtle line-through' : 'text-nido-ink'
                          }`}
                        >
                          {item.product_name}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-nido-olive-soft px-2 py-0.5 text-[10px] font-medium text-nido-olive">
                          <Sparkles className="h-2.5 w-2.5" />
                          Stock bajo
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-lg border border-nido-border bg-nido-bg px-2.5 py-1 text-xs font-semibold text-nido-ink">
                        {item.suggested_quantity} {item.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => setItemToRemove(item)}
                        title="Quitar de la lista"
                        aria-label={`Quitar ${item.product_name} de la lista`}
                        className="cursor-pointer rounded-lg p-1.5 text-nido-subtle transition-colors hover:bg-nido-terracotta-bg hover:text-nido-terracotta-text"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {closedLists.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-nido-border-strong bg-nido-surface px-6 py-14 text-center">
                <History className="mx-auto h-8 w-8 text-nido-subtle" />
                <p className="mt-3 text-sm font-semibold text-nido-ink">Todavía no hay compras cerradas</p>
                <p className="mt-1 text-xs text-nido-muted">
                  Cuando confirmes una compra, la lista queda registrada acá.
                </p>
              </div>
            ) : (
              closedLists.map((list) => {
                const isOpen = expandedId === list.id;
                const detail: ShoppingListDetail | null =
                  isOpen && historyDetail?.id === list.id ? historyDetail : null;
                const purchasedAt = list.purchased_at ?? list.created_at;

                return (
                  <div
                    key={list.id}
                    className="overflow-hidden rounded-2xl border border-nido-border bg-nido-surface"
                  >
                    <button
                      type="button"
                      onClick={() => void handleExpandHistory(list.id)}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left hover:bg-nido-bg/50"
                      aria-expanded={isOpen}
                    >
                      <div>
                        <p className="text-xs font-semibold text-nido-ink">
                          Compra del {formatDate(purchasedAt)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-nido-subtle">
                          {list.item_count}{' '}
                          {list.item_count === 1 ? 'insumo comprado' : 'insumos comprados'}
                        </p>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-nido-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen &&
                      (detail ? (
                        <ul className="divide-y divide-nido-border border-t border-nido-border bg-nido-card-alt/50">
                          {detail.items.map((item) => (
                            <li
                              key={item.product_id}
                              className="flex items-center justify-between px-5 py-3 text-xs"
                            >
                              <span className="font-medium text-nido-ink">{item.product_name}</span>
                              <span className="rounded-lg bg-nido-sage-bg px-2.5 py-1 text-[11px] font-semibold text-nido-sage-text">
                                +{item.suggested_quantity} {item.unit}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="border-t border-nido-border px-5 py-3 text-xs text-nido-subtle">
                          Cargando detalle…
                        </p>
                      ))}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {itemToRemove && (
        <ConfirmDialog
          title="Quitar de la lista"
          tone="danger"
          confirmLabel={isRemoving ? 'Quitando…' : 'Quitar'}
          description={
            <>
              Se quita <strong>{itemToRemove.product_name}</strong> de esta lista. Si el producto sigue
              por debajo del mínimo, va a volver a aparecer la próxima vez que sincronices los
              faltantes.
            </>
          }
          onConfirm={() => void handleConfirmRemove()}
          onCancel={() => setItemToRemove(null)}
        />
      )}

      {isConfirmOpen && (
        <ConfirmDialog
          title="Confirmar compra"
          confirmLabel={isPurchasing ? 'Confirmando…' : 'Confirmar compra'}
          description="Se va a sumar al inventario el stock de los productos marcados y la lista quedará archivada en el historial."
          onConfirm={() => void handleConfirmPurchase()}
          onCancel={() => setIsConfirmOpen(false)}
        >
          <ul className="divide-y divide-nido-border overflow-hidden rounded-xl border border-nido-border">
            {purchasedItems.map((item) => (
              <li key={item.product_id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <span className="font-medium text-nido-ink">{item.product_name}</span>
                <span className="rounded-lg bg-nido-sage-bg px-2 py-0.5 text-[11px] font-semibold text-nido-sage-text">
                  +{item.suggested_quantity} {item.unit}
                </span>
              </li>
            ))}
          </ul>
          {totalCount > purchasedCount && (
            <p className="text-[11px] text-nido-subtle">
              Los {totalCount - purchasedCount} ítems sin marcar no se compran: volverán a aparecer al
              sincronizar si siguen bajo el mínimo.
            </p>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
};
