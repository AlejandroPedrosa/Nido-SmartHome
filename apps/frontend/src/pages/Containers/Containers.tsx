import { useState, type FC, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArrowUpRight, Package, Plus, X } from 'lucide-react';

interface ContainerCardMock {
    id: string;
    name: string;
    description: string;
    productCount: number;
    capacityMax: number;
    lowStockCount: number;
}

    const INITIAL_CONTAINERS: ContainerCardMock[] = [
    { id: '1', name: 'Alacena', description: 'Alimentos secos, conservas, pastas y especias', productCount: 94, capacityMax: 120, lowStockCount: 2 },
    { id: '2', name: 'Heladera', description: 'Lácteos, verduras frescas, bebidas y salsas', productCount: 68, capacityMax: 90, lowStockCount: 2 },
    { id: '3', name: 'Freezer', description: 'Carnes congeladas, vegetales y comidas preparadas', productCount: 42, capacityMax: 60, lowStockCount: 0 },
    { id: '4', name: 'Cocina', description: 'Utensilios, aceites de uso diario y condimentos', productCount: 24, capacityMax: 35, lowStockCount: 1 },
    { id: '5', name: 'Lavadero', description: 'Detergentes, suavizantes y artículos de limpieza', productCount: 12, capacityMax: 30, lowStockCount: 1 },
    { id: '6', name: 'Baño', description: 'Higiene personal, papel y botiquín básico', productCount: 8, capacityMax: 30, lowStockCount: 1 },
];

export const Containers: FC = () => {
    const [containers, setContainers] = useState<ContainerCardMock[]>(INITIAL_CONTAINERS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [capacityMax, setCapacityMax] = useState('40');

    const handleAddContainer = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!name.trim()) return;

        setContainers((prev) => [
        ...prev,
        {
            id: String(Date.now()),
            name: name.trim(),
            description: description.trim() || 'Espacio personalizado del hogar',
            productCount: 0,
            capacityMax: Math.max(1, Number(capacityMax) || 40),
            lowStockCount: 0,
        },
        ]);

        setName('');
        setDescription('');
        setCapacityMax('40');
        setIsModalOpen(false);
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-nido-olive-hover sm:self-auto"
            >
            <Plus className="h-4 w-4" />
            <span>Nuevo contenedor</span>
            </button>
        </header>

        {/* Grilla de espacios */}
        <div className="mx-auto w-full max-w-7xl p-6 lg:p-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {containers.map((container) => {
                const pct = Math.min(100, Math.round((container.productCount / container.capacityMax) * 100));

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
                        {container.lowStockCount > 0 ? (
                        <span className="rounded-full bg-nido-terracotta-bg px-2.5 py-1 text-[11px] font-semibold text-nido-terracotta-text">
                            {container.lowStockCount} por reponer
                        </span>
                        ) : (
                        <span className="rounded-full bg-nido-sage-bg px-2.5 py-1 text-[11px] font-semibold text-nido-sage-text">
                            Al día
                        </span>
                        )}
                    </div>

                    <h2 className="mt-4 text-base font-bold text-nido-ink">{container.name}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-nido-muted">
                        {container.description}
                    </p>
                    </div>

                    <div className="mt-6 space-y-4">
                    <div>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 font-medium text-nido-secondary">
                            <Package className="h-3.5 w-3.5 text-nido-subtle" />
                            {container.productCount} / {container.capacityMax} ítems
                        </span>
                        <span className="font-semibold text-nido-ink">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-nido-olive-soft">
                        <div
                            className="h-full rounded-full bg-nido-olive transition-all"
                            style={{ width: `${pct}%` }}
                        />
                        </div>
                    </div>

                    <Link
                        to="/products"
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-nido-border bg-nido-card-alt py-2 text-xs font-semibold text-nido-ink transition-colors hover:border-nido-olive hover:bg-nido-surface"
                    >
                        <span>Ver productos</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    </div>
                </article>
                );
            })}
            </div>
        </div>

        {/* Modal Nuevo Contenedor */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-nido-ink/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-nido-border bg-nido-surface p-6 shadow-xl">
                <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-bold text-nido-ink">Crear contenedor</h2>
                <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="cursor-pointer rounded-lg p-1.5 text-nido-subtle hover:bg-nido-bg hover:text-nido-ink"
                >
                    <X className="h-4 w-4" />
                </button>
                </div>

                <form onSubmit={handleAddContainer} className="space-y-4">
                <div>
                    <label className="mb-1 block text-xs font-medium text-nido-ink">Nombre del espacio</label>
                    <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Despensa secundaria"
                    className="w-full rounded-xl border border-nido-border-strong px-3.5 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-nido-ink">Descripción</label>
                    <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Qué productos se guardan acá"
                    className="w-full rounded-xl border border-nido-border-strong px-3.5 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-nido-ink">Capacidad estimada (ítems)</label>
                    <input
                    type="number"
                    min="1"
                    value={capacityMax}
                    onChange={(e) => setCapacityMax(e.target.value)}
                    className="w-full rounded-xl border border-nido-border-strong px-3.5 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
                    />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                    <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="cursor-pointer rounded-xl border border-nido-border px-4 py-2 text-xs font-medium text-nido-secondary hover:bg-nido-bg"
                    >
                    Cancelar
                    </button>
                    <button
                    type="submit"
                    className="cursor-pointer rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white hover:bg-nido-olive-hover"
                    >
                    Crear espacio
                    </button>
                </div>
                </form>
            </div>
            </div>
        )}
        </div>
    );
};