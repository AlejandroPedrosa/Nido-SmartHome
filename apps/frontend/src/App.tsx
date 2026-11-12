import type { FC } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Auth/Login';
import { Register } from '@/pages/Auth/Register';
import { Dashboard } from '@/pages/Dashboard/Dashboard';
import { Recipes } from '@/pages/Recipes/Recipes';

interface PlaceholderProps {
  title: string;
}

const PlaceholderView: FC<PlaceholderProps> = ({ title }) => (
  <div className="p-6 lg:p-8">
    <div className="rounded-2xl border border-nido-border bg-nido-surface p-8">
      <h2 className="text-xl font-bold text-nido-ink">{title}</h2>
      <p className="mt-1 text-xs text-nido-muted">
        Vista lista para maquetar en el siguiente paso.
      </p>
    </div>
  </div>
);

export const App: FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<PlaceholderView title="Productos" />} />
          <Route path="/containers" element={<PlaceholderView title="Contenedores" />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/shopping-list" element={<PlaceholderView title="Lista de Compras" />} />
          <Route path="/settings" element={<PlaceholderView title="Configuración" />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;