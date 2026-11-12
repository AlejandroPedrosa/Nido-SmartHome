import { useState, type FC } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    Archive,
    ChefHat,
    LayoutGrid,
    Menu,
    MoreHorizontal,
    Package,
    Settings,
    ShoppingBag,
    X,
    type LucideIcon,
} from 'lucide-react';
import { NidoLogo } from '@/components/ui/NidoLogo';

interface NavigationItem {
    to: string;
    label: string;
    icon: LucideIcon;
    badge?: number;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
    { to: '/dashboard', label: 'Panel Principal', icon: LayoutGrid },
    { to: '/products', label: 'Productos', icon: Package },
    { to: '/containers', label: 'Contenedores', icon: Archive },
    { to: '/recipes', label: 'Recetas', icon: ChefHat },
    { to: '/shopping-list', label: 'Lista de Compras', icon: ShoppingBag, badge: 7 },
    { to: '/settings', label: 'Configuración', icon: Settings },
];

export const AppLayout: FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="flex min-h-screen flex-col bg-nido-bg text-nido-ink md:flex-row">
        {/* Barra superior en mobile */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-nido-border bg-nido-surface px-4 py-3 md:hidden">
            <NidoLogo size="sm" />
            <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="rounded-lg p-2 text-nido-ink transition-colors hover:bg-nido-bg"
            aria-label="Alternar menú de navegación"
            >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
        </header>

        {/* Sidebar lateral */}
        <aside
            className={`${
            isMobileMenuOpen ? 'flex' : 'hidden'
            } w-full shrink-0 flex-col justify-between border-r border-nido-border bg-nido-surface px-4 py-6 md:sticky md:top-0 md:flex md:h-screen md:w-64`}
        >
            <div>
            <div className="mb-8 hidden px-2 md:block">
                <NidoLogo />
            </div>

            <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.12em] text-nido-subtle uppercase">
                Inventario del hogar
            </p>

            <nav className="space-y-1">
                {NAVIGATION_ITEMS.map(({ to, label, icon: Icon, badge }) => (
                <NavLink
                    key={to}
                    to={to}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-3 py-2.5 text-[13.5px] transition-colors ${
                        isActive
                        ? 'bg-nido-olive-soft font-semibold text-nido-ink'
                        : 'font-medium text-nido-secondary hover:bg-nido-bg hover:text-nido-ink'
                    }`
                    }
                >
                    <div className="flex items-center gap-3">
                    <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                    <span>{label}</span>
                    </div>
                    {badge !== undefined && (
                    <span className="rounded-full bg-nido-terracotta-bg px-2 py-0.5 text-[11px] font-semibold text-nido-terracotta-text">
                        {badge}
                    </span>
                    )}
                </NavLink>
                ))}
            </nav>
            </div>

            {/* Sección inferior del sidebar */}
            <div className="space-y-4 pt-4">
            <div className="rounded-2xl border border-nido-border bg-nido-card-alt p-3.5">
                <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-nido-ink">Capacidad del hogar</span>
                <span className="font-medium text-nido-muted">68%</span>
                </div>
                <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-nido-border-strong">
                <div className="h-full w-[68%] rounded-full bg-nido-olive" />
                </div>
                <p className="text-[11px] text-nido-subtle">248 de 365 productos utilizados</p>
            </div>

            <div className="flex items-center justify-between border-t border-nido-border px-1 pt-3">
                <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-nido-border-strong bg-nido-olive-soft text-[11px] font-semibold text-nido-olive">
                    User
                </div>
                <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-nido-ink">Usuario</p>
                    <p className="truncate text-[11px] text-nido-subtle">Casa Av. Siempreviva</p>
                </div>
                </div>
                <button
                type="button"
                onClick={() => navigate('/login')}
                title="Cerrar sesión"
                className="cursor-pointer rounded-lg p-1.5 text-nido-subtle transition-colors hover:bg-nido-bg hover:text-nido-ink"
                >
                <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>
            </div>
        </aside>

        {/* Contenido dinámico de cada página */}
        <main className="min-w-0 flex-1">
            <Outlet />
        </main>
        </div>
    );
};