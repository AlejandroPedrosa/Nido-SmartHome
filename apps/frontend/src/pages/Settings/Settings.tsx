import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, User } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

export const Settings: FC = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-nido-border bg-nido-surface px-6 py-4 lg:px-8">
        <h1 className="text-base font-bold text-nido-ink">Configuración</h1>
        <p className="text-xs text-nido-subtle">Tu cuenta y sesión</p>
      </header>

      <div className="mx-auto w-full max-w-3xl space-y-6 p-6 lg:p-8">
        <section className="rounded-2xl border border-nido-border bg-nido-surface p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-nido-ink">
            <User className="h-4 w-4 text-nido-olive" />
            <h2>Mi cuenta</h2>
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-nido-border-strong bg-nido-olive-soft text-nido-olive">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-nido-subtle">Sesión iniciada como</p>
                <p className="truncate text-sm font-semibold text-nido-ink">
                  {user?.email ?? '—'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-nido-terracotta-border bg-nido-terracotta-bg px-4 py-2 text-xs font-semibold text-nido-terracotta-text transition-colors hover:opacity-90"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </section>
      </div>

    </div>
  );
};
