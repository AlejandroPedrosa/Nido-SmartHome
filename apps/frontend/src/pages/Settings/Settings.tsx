import { useState, type FC, type FormEvent } from 'react';
import { Bell, CheckCircle2, Home, User } from 'lucide-react';

export const Settings: FC = () => {
    const [homeName, setHomeName] = useState('Casa Av. Siempreviva');
    const [userName, setUserName] = useState('Usuario');
    const [lowStockAlerts, setLowStockAlerts] = useState(true);
    const [autoShoppingList, setAutoShoppingList] = useState(true);
    const [saved, setSaved] = useState(false);

    const handleSave = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="flex min-h-screen flex-col">
        <header className="border-b border-nido-border bg-nido-surface px-6 py-4 lg:px-8">
            <h1 className="text-base font-bold text-nido-ink">Configuración</h1>
            <p className="text-xs text-nido-subtle">
            Preferencias de tu perfil, hogar y alertas de reposición
            </p>
        </header>

        <form onSubmit={handleSave} className="mx-auto w-full max-w-3xl space-y-6 p-6 lg:p-8">
            {saved && (
            <div className="flex items-center gap-2 rounded-2xl bg-nido-sage-bg px-4 py-3 text-xs font-medium text-nido-sage-text">
                <CheckCircle2 className="h-4 w-4" />
                <span>Cambios guardados correctamente.</span>
            </div>
            )}

            <section className="space-y-4 rounded-2xl border border-nido-border bg-nido-surface p-6">
            <div className="flex items-center gap-2 text-sm font-bold text-nido-ink">
                <Home className="h-4 w-4 text-nido-olive" />
                <h2>Datos del Hogar y Perfil</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                <label className="mb-1.5 block text-xs font-medium text-nido-ink">
                    Nombre del hogar
                </label>
                <input
                    type="text"
                    value={homeName}
                    onChange={(e) => setHomeName(e.target.value)}
                    className="w-full rounded-xl border border-nido-border-strong px-3.5 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
                />
                </div>

                <div>
                <label className="mb-1.5 block text-xs font-medium text-nido-ink">
                    Nombre de usuario
                </label>
                <div className="relative">
                    <User className="absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-nido-subtle" />
                    <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full rounded-xl border border-nido-border-strong py-2 pr-3.5 pl-9 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
                    />
                </div>
                </div>
            </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-nido-border bg-nido-surface p-6">
            <div className="flex items-center gap-2 text-sm font-bold text-nido-ink">
                <Bell className="h-4 w-4 text-nido-olive" />
                <h2>Automatización de Inventario</h2>
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-nido-border pb-4">
                <div>
                <p className="text-xs font-semibold text-nido-ink">Alertas de stock mínimo</p>
                <p className="text-[11px] text-nido-muted">
                    Destacar productos cuando su cantidad caiga por debajo del mínimo configurado
                </p>
                </div>
                <input
                type="checkbox"
                checked={lowStockAlerts}
                onChange={(e) => setLowStockAlerts(e.target.checked)}
                className="h-4 w-4 accent-nido-olive"
                />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-4">
                <div>
                <p className="text-xs font-semibold text-nido-ink">
                    Sugerir automáticamente en lista de compras
                </p>
                <p className="text-[11px] text-nido-muted">
                    Agregar ítems faltantes a la lista de compras al cocinar recetas o consumir stock
                </p>
                </div>
                <input
                type="checkbox"
                checked={autoShoppingList}
                onChange={(e) => setAutoShoppingList(e.target.checked)}
                className="h-4 w-4 accent-nido-olive"
                />
            </label>
            </section>

            <div className="flex justify-end">
            <button
                type="submit"
                className="cursor-pointer rounded-xl bg-nido-olive px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-nido-olive-hover"
            >
                Guardar preferencias
            </button>
            </div>
        </form>
        </div>
    );
};