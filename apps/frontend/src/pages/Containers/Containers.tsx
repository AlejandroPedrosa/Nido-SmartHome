import { useState, type FC } from 'react';
import { Archive, CheckCircle2, MoreHorizontal, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { MOCK_PRODUCTS, type ProductMock } from '@/mocks/inventory';
import { ContainerDetail } from '@/pages/Containers/ContainerDetail';
import { ContainerForm } from '@/pages/Containers/ContainerForm';
import { ProductAssigner } from '@/pages/Containers/ProductAssigner';

interface ContainerMock {
    id: string;
    name: string;
}

/** Contenedores sugeridos que se precargan al registrar un usuario (CT-02). */
const INITIAL_CONTAINERS: ContainerMock[] = [
    { id: '1', name: 'Cocina' },
    { id: '2', name: 'Heladera' },
    { id: '3', name: 'Freezer' },
    { id: '4', name: 'Alacena' },
    { id: '5', name: 'Baño' },
    { id: '6', name: 'Lavadero' },
];

type ActiveModal =
    | { kind: 'create' }
    | { kind: 'edit'; containerId: string }
    | { kind: 'detail'; containerId: string }
    | { kind: 'assign'; containerId: string }
    | { kind: 'delete'; containerId: string }
    | null;

export const Containers: FC = () => {
    const [containers, setContainers] = useState<ContainerMock[]>(INITIAL_CONTAINERS);
    const [products, setProducts] = useState<ProductMock[]>(MOCK_PRODUCTS);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [modal, setModal] = useState<ActiveModal>(null);
    const [toast, setToast] = useState<string | null>(null);

    const modalContainer =
        modal && modal.kind !== 'create' ? containers.find((c) => c.id === modal.containerId) : undefined;

    const productsIn = (containerName: string) => products.filter((p) => p.containers.includes(containerName));

    const showToast = (message: string) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const handleCreate = (name: string) => {
        setContainers((prev) => [...prev, { id: String(Date.now()), name }]);
        setModal(null);
        showToast(`Contenedor "${name}" creado.`);
    };

    const handleRename = (container: ContainerMock, newName: string) => {
        setContainers((prev) => prev.map((c) => (c.id === container.id ? { ...c, name: newName } : c)));
        setProducts((prev) =>
            prev.map((p) => ({
                ...p,
                containers: p.containers.map((name) => (name === container.name ? newName : name)),
            })),
        );
        setModal(null);
        showToast('Cambios guardados.');
    };

    const handleDelete = (container: ContainerMock) => {
        setContainers((prev) => prev.filter((c) => c.id !== container.id));
        setProducts((prev) =>
            prev.map((p) => ({ ...p, containers: p.containers.filter((name) => name !== container.name) })),
        );
        setModal(null);
        showToast(`Contenedor "${container.name}" eliminado. Los productos siguen en el inventario.`);
    };

    const handleAssign = (container: ContainerMock, assignedIds: string[]) => {
        setProducts((prev) =>
            prev.map((p) => {
                const shouldBeIn = assignedIds.includes(p.id);
                const isIn = p.containers.includes(container.name);
                if (shouldBeIn && !isIn) return { ...p, containers: [...p.containers, container.name] };
                if (!shouldBeIn && isIn) return { ...p, containers: p.containers.filter((n) => n !== container.name) };
                return p;
            }),
        );
        setModal({ kind: 'detail', containerId: container.id });
        showToast('Asignación actualizada.');
    };

    const handleUnassign = (container: ContainerMock, productId: string) => {
        setProducts((prev) =>
            prev.map((p) =>
                p.id === productId ? { ...p, containers: p.containers.filter((n) => n !== container.name) } : p,
            ),
        );
    };

    const openFromMenu = (next: NonNullable<ActiveModal>) => {
        setOpenMenuId(null);
        setModal(next);
    };

    return (
        <div className="flex min-h-screen flex-col">
            {/* Topbar */}
            <header className="flex flex-col justify-between gap-4 border-b border-nido-border bg-nido-surface px-6 py-4 sm:flex-row sm:items-center lg:px-8">
                <div>
                    <h1 className="text-base font-bold text-nido-ink">Contenedores</h1>
                    <p className="text-xs text-nido-subtle">
                        {containers.length} espacios activos organizados en tu hogar
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setModal({ kind: 'create' })}
                    className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-nido-olive-hover sm:self-auto"
                >
                    <Plus className="h-4 w-4" />
                    <span>Nuevo contenedor</span>
                </button>
            </header>

            {/* Grilla de espacios */}
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

                {containers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-nido-border-strong bg-nido-surface px-6 py-16 text-center">
                        <Archive className="mx-auto h-8 w-8 text-nido-subtle" />
                        <p className="mt-3 text-sm font-semibold text-nido-ink">Todavía no tenés espacios</p>
                        <p className="mt-1 text-xs text-nido-muted">
                            Creá tu primer contenedor para empezar a organizar el inventario.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {containers.map((container) => {
                            const assigned = productsIn(container.name);
                            const lowStockCount = assigned.filter((p) => p.currentStock < p.minStock).length;
                            const isMenuOpen = openMenuId === container.id;

                            return (
                                <article
                                    key={container.id}
                                    className="flex flex-col justify-between rounded-2xl border border-nido-border bg-nido-surface p-6 transition-shadow hover:shadow-[0_8px_24px_rgba(30,34,29,0.05)]"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-nido-olive-soft text-nido-olive">
                                                <Archive className="h-5 w-5" />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {lowStockCount > 0 ? (
                                                    <span className="rounded-full bg-nido-terracotta-bg px-2.5 py-1 text-[11px] font-semibold text-nido-terracotta-text">
                                                        {lowStockCount} por reponer
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-nido-sage-bg px-2.5 py-1 text-[11px] font-semibold text-nido-sage-text">
                                                        Al día
                                                    </span>
                                                )}

                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenMenuId(isMenuOpen ? null : container.id)}
                                                        aria-label={`Acciones para ${container.name}`}
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
                                                            <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-nido-border bg-nido-surface py-1 shadow-lg">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openFromMenu({ kind: 'edit', containerId: container.id })}
                                                                    className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-xs text-nido-ink hover:bg-nido-bg"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5 text-nido-secondary" />
                                                                    Editar nombre
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openFromMenu({ kind: 'delete', containerId: container.id })}
                                                                    className="flex w-full cursor-pointer items-center gap-2 border-t border-nido-border px-3.5 py-2 text-xs text-nido-terracotta-text hover:bg-nido-terracotta-bg"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                    Eliminar
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <h2 className="mt-4 text-base font-bold text-nido-ink">{container.name}</h2>
                                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-nido-secondary">
                                            <Package className="h-3.5 w-3.5 text-nido-subtle" />
                                            {assigned.length} {assigned.length === 1 ? 'producto' : 'productos'}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setModal({ kind: 'detail', containerId: container.id })}
                                        className="mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-nido-border bg-nido-card-alt py-2 text-xs font-semibold text-nido-ink transition-colors hover:border-nido-olive hover:bg-nido-surface"
                                    >
                                        Ver productos
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modales */}
            {modal?.kind === 'create' && (
                <ContainerForm
                    existingNames={containers.map((c) => c.name)}
                    onSubmit={handleCreate}
                    onClose={() => setModal(null)}
                />
            )}

            {modal?.kind === 'edit' && modalContainer && (
                <ContainerForm
                    initialName={modalContainer.name}
                    existingNames={containers.map((c) => c.name)}
                    onSubmit={(name) => handleRename(modalContainer, name)}
                    onClose={() => setModal(null)}
                />
            )}

            {modal?.kind === 'detail' && modalContainer && (
                <ContainerDetail
                    name={modalContainer.name}
                    products={productsIn(modalContainer.name)}
                    onAssign={() => setModal({ kind: 'assign', containerId: modalContainer.id })}
                    onUnassign={(productId) => handleUnassign(modalContainer, productId)}
                    onClose={() => setModal(null)}
                />
            )}

            {modal?.kind === 'assign' && modalContainer && (
                <ProductAssigner
                    containerName={modalContainer.name}
                    products={products}
                    onSave={(ids) => handleAssign(modalContainer, ids)}
                    onClose={() => setModal({ kind: 'detail', containerId: modalContainer.id })}
                />
            )}

            {modal?.kind === 'delete' && modalContainer && (
                <ConfirmDialog
                    title="Eliminar contenedor"
                    tone="danger"
                    confirmLabel="Eliminar contenedor"
                    description={
                        <>
                            Vas a eliminar <strong>{modalContainer.name}</strong>. Los{' '}
                            {productsIn(modalContainer.name).length} productos asignados <strong>no se borran</strong>:
                            solo se desvinculan de este espacio y conservan su stock.
                        </>
                    }
                    onConfirm={() => handleDelete(modalContainer)}
                    onCancel={() => setModal(null)}
                />
            )}
        </div>
    );
};
