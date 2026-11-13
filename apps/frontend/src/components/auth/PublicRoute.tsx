import { useEffect, type FC } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

/** Login / register: si ya hay sesión, ir al dashboard. */
export const PublicRoute: FC = () => {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [hydrate, isHydrated]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nido-bg text-xs text-nido-muted">
        Cargando sesión...
      </div>
    );
  }

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
