import { useEffect, useMemo, useState, type FC } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Filter,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StockBadge } from '@/components/ui/StockBadge';
import { ApiError } from '@/lib/api';
import { ProductDetail } from '@/pages/Products/ProductDetail';
import { ProductForm } from '@/pages/Products/ProductForm';
import { StockAdjuster } from '@/pages/Products/StockAdjuster';
import { useContainersStore } from '@/stores/useContainersStore';
import { useProductsStore } from '@/stores/useProductsStore';
import type { ProductQuery } from '@/types';

type ActiveModal =
  | { kind: 'create' }
  | { kind: 'edit'; productId: string }
  | { kind: 'adjust'; productId: string }
  | { kind: 'detail'; productId: string }
  | { kind: 'delete'; productId: string }
  | null;

export const Products: FC = () => {
  const products = useProductsStore((s) => s.products);
  const filters = useProductsStore((s) => s.filters);
  const isLoading = useProductsStore((s) => s.isLoading);
  const error = useProductsStore((s) => s.error);
  const setFilters = useProductsStore((s) => s.setFilters);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const deleteProduct = useProductsStore((s) => s.deleteProduct);

  const containers = useContainersStore((s) => s.containers);
  const fetchContainers = useContainersStore((s) => s.fetchContainers);

  const [searchInput, setSearchInput] = useState(filters.name ?? '');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<ActiveModal>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    void fetchProducts();
    void fetchContainers();
  }, [fetchProducts, fetchContainers]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const name = searchInput.trim() || undefined;
      const current = useProductsStore.getState().filters;
      if (name === current.name) return;
      setFilters({ ...current, name });
      void fetchProducts();
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput, setFilters, fetchProducts]);

  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c)))).sort(),
    [products],
  );

  const modalProduct =
    modal && modal.kind !== 'create' ? products.find((p) => p.id === modal.productId) : undefined;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  };

  const applyFilters = (patch: ProductQuery) => {
    const current = useProductsStore.getState().filters;
    const next: ProductQuery = { ...current };

    if ('name' in patch) {
      if (patch.name) next.name = patch.name;
      else delete next.name;
    }
    if ('category' in patch) {
      if (patch.category) next.category = patch.category;
      else delete next.category;
    }
    if ('container_id' in patch) {
      if (patch.container_id) next.container_id = patch.container_id;
      else delete next.container_id;
    }
    if ('low_stock' in patch) {
      if (patch.low_stock) next.low_stock = true;
      else delete next.low_stock;
    }

    setFilters(next);
    void fetchProducts();
  };

  const handleDelete = async () => {
    if (!modalProduct) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteProduct(modalProduct.id);
      setModal(null);
      showToast(`Producto "${modalProduct.name}" eliminado junto con su historial.`);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setDeleteError(err.message);
      } else if (err instanceof ApiError) {
        setDeleteError(err.message);
      } else {
        setDeleteError('No se pudo eliminar el producto.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const openFromMenu = (next: NonNullable<ActiveModal>) => {
    setOpenMenuId(null);
    if (next.kind === 'delete') setDeleteError(null);
    setModal(next);
  };

  const selectedContainerId = filters.container_id ?? '';
  const selectedCategory = filters.category ?? '';
  const onlyLowStock = Boolean(filters.low_stock);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-col justify-between gap-4 border-b border-nido-border bg-nido-surface px-6 py-4 sm:flex-row sm:items-center lg:px-8">
        <div>
          <h1 className="text-base font-bold text-nido-ink">Productos</h1>
          <p className="text-xs text-nido-subtle">
            {isLoading ? 'Cargando inventario…' : `${products.length} productos registrados en el inventario`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-nido-subtle" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre..."
              aria-label="Buscar producto por nombre"
              className="w-full rounded-xl border border-nido-border bg-nido-bg py-2 pr-4 pl-9 text-xs text-nido-ink placeholder:text-nido-subtle focus:border-nido-olive focus:bg-nido-surface focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setModal({ kind: 'create' })}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-nido-olive-hover"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo producto</span>
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl space-y-6 p-6 lg:p-8">
        {toast && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-2xl border border-nido-sage-text/20 bg-nido-sage-bg px-4 py-3 text-xs font-medium text-nido-sage-text"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toast}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-nido-terracotta-border bg-nido-terracotta-bg px-4 py-3 text-xs font-medium text-nido-terracotta-text"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyFilters({ container_id: undefined })}
              className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                !selectedContainerId
                  ? 'bg-nido-olive font-semibold text-white'
                  : 'border border-nido-border bg-nido-surface text-nido-secondary hover:text-nido-ink'
              }`}
            >
              Todos
            </button>
            {containers.map((container) => (
              <button
                key={container.id}
                type="button"
                onClick={() => applyFilters({ container_id: container.id })}
                className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedContainerId === container.id
                    ? 'bg-nido-olive font-semibold text-white'
                    : 'border border-nido-border bg-nido-surface text-nido-secondary hover:text-nido-ink'
                }`}
              >
                {container.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) =>
                applyFilters({ category: e.target.value ? e.target.value : undefined })
              }
              aria-label="Filtrar por categoría"
              className="cursor-pointer rounded-xl border border-nido-border bg-nido-surface px-3 py-1.5 text-xs font-medium text-nido-ink focus:border-nido-olive focus:outline-none"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => applyFilters({ low_stock: onlyLowStock ? undefined : true })}
              aria-pressed={onlyLowStock}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                onlyLowStock
                  ? 'border-nido-terracotta-border bg-nido-terracotta-bg font-semibold text-nido-terracotta-text'
                  : 'border-nido-border bg-nido-surface text-nido-secondary hover:text-nido-ink'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Solo stock bajo</span>
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-nido-border bg-nido-surface">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-nido-border bg-nido-card-alt text-[11px] font-semibold tracking-wider text-nido-subtle uppercase">
                  <th className="px-5 py-3.5">Nombre</th>
                  <th className="px-5 py-3.5">Categoría</th>
                  <th className="px-5 py-3.5">Contenedores</th>
                  <th className="px-5 py-3.5">Stock actual</th>
                  <th className="px-5 py-3.5">Stock mín.</th>
                  <th className="px-5 py-3.5">Unidad</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nido-border text-xs">
                {products.map((product) => {
                  const isMenuOpen = openMenuId === product.id;

                  return (
                    <tr key={product.id} className="transition-colors hover:bg-nido-bg/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-nido-olive-soft text-nido-olive">
                            <Package className="h-4 w-4" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setModal({ kind: 'detail', productId: product.id })}
                            className="cursor-pointer text-left font-semibold text-nido-ink hover:underline"
                          >
                            {product.name}
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-nido-secondary">
                        {product.category || <span className="text-nido-subtle">—</span>}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {product.containers.length === 0 ? (
                            <span className="text-nido-subtle">—</span>
                          ) : (
                            product.containers.map((container) => (
                              <span
                                key={container.id}
                                className="rounded-lg border border-nido-border bg-nido-card-alt px-2 py-0.5 text-[11px] font-medium text-nido-secondary"
                              >
                                {container.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold text-nido-ink">{product.current_stock}</td>
                      <td className="px-5 py-4 text-nido-secondary">{product.min_stock}</td>
                      <td className="px-5 py-4 text-nido-secondary">{product.unit}</td>

                      <td className="px-5 py-4">
                        <StockBadge status={product.stock_status} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setOpenMenuId(isMenuOpen ? null : product.id)}
                            aria-label={`Acciones para ${product.name}`}
                            aria-expanded={isMenuOpen}
                            className="cursor-pointer rounded-lg p-1.5 text-nido-subtle transition-colors hover:bg-nido-bg hover:text-nido-ink"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {isMenuOpen && (
                            <>
                              <button
                                type="button"
                                aria-label="Cerrar menú"
                                onClick={() => setOpenMenuId(null)}
                                className="fixed inset-0 z-10 cursor-default"
                              />
                              <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-nido-border bg-nido-surface py-1 shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => openFromMenu({ kind: 'adjust', productId: product.id })}
                                  className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-xs text-nido-ink hover:bg-nido-bg"
                                >
                                  <SlidersHorizontal className="h-3.5 w-3.5 text-nido-secondary" />
                                  Ajustar stock
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openFromMenu({ kind: 'detail', productId: product.id })}
                                  className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-xs text-nido-ink hover:bg-nido-bg"
                                >
                                  <ClipboardList className="h-3.5 w-3.5 text-nido-secondary" />
                                  Ver historial
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openFromMenu({ kind: 'edit', productId: product.id })}
                                  className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-xs text-nido-ink hover:bg-nido-bg"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-nido-secondary" />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openFromMenu({ kind: 'delete', productId: product.id })}
                                  className="flex w-full cursor-pointer items-center gap-2 border-t border-nido-border px-3.5 py-2 text-xs text-nido-terracotta-text hover:bg-nido-terracotta-bg"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Eliminar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {isLoading && products.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-nido-ink">Cargando productos…</p>
            </div>
          )}

          {!isLoading && !error && products.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Package className="mx-auto h-8 w-8 text-nido-subtle" />
              <p className="mt-3 text-sm font-semibold text-nido-ink">Sin resultados</p>
              <p className="mt-1 text-xs text-nido-muted">
                Ningún producto coincide con los filtros aplicados.
              </p>
            </div>
          )}
        </div>
      </div>

      {modal?.kind === 'create' && (
        <ProductForm
          existingNames={products.map((p) => p.name)}
          onSuccess={() => {
            setModal(null);
            showToast('Producto creado.');
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.kind === 'edit' && modalProduct && (
        <ProductForm
          product={modalProduct}
          existingNames={products.map((p) => p.name)}
          onSuccess={() => {
            setModal(null);
            showToast('Cambios guardados.');
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.kind === 'adjust' && modalProduct && (
        <StockAdjuster
          product={modalProduct}
          onSuccess={() => {
            setModal(null);
            showToast('Ajuste registrado en el historial de auditoría.');
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.kind === 'detail' && (
        <ProductDetail productId={modal.productId} onClose={() => setModal(null)} />
      )}

      {modal?.kind === 'delete' && modalProduct && (
        <ConfirmDialog
          title="Eliminar producto"
          tone="danger"
          confirmLabel={isDeleting ? 'Eliminando…' : 'Eliminar'}
          description={
            <>
              Vas a eliminar <strong>{modalProduct.name}</strong> y todo su historial de movimientos.
              Esta acción no se puede deshacer.
            </>
          }
          blocking={Boolean(deleteError) || isDeleting}
          warning={deleteError ?? undefined}
          onConfirm={() => {
            void handleDelete();
          }}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
};
