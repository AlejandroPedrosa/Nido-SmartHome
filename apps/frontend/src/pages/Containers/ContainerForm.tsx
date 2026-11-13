import { useState, type FC, type FormEvent } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ApiError } from '@/lib/api';

interface ContainerFormProps {
  /** Si viene, el modal funciona en modo edición. */
  initialName?: string;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
}

export const ContainerForm: FC<ContainerFormProps> = ({ initialName, onSubmit, onClose }) => {
  const isEdit = initialName !== undefined;
  const [name, setName] = useState(initialName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('El nombre es obligatorio.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit(trimmed);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setError(err.message || 'Ya existe un contenedor con ese nombre.');
      } else {
        setError(err instanceof Error ? err.message : 'No se pudo guardar el contenedor.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Editar contenedor' : 'Crear contenedor'}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="cursor-pointer rounded-xl border border-nido-border px-4 py-2 text-xs font-medium text-nido-secondary hover:bg-nido-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="container-form"
            disabled={isSaving}
            className="cursor-pointer rounded-xl bg-nido-olive px-4 py-2 text-xs font-semibold text-white hover:bg-nido-olive-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear espacio'}
          </button>
        </>
      }
    >
      <form id="container-form" onSubmit={handleSubmit} className="space-y-4 pb-2">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-nido-terracotta-border bg-nido-terracotta-bg p-3 text-xs text-nido-terracotta-text">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="container-name" className="mb-1 block text-xs font-medium text-nido-ink">
            Nombre del espacio
          </label>
          <input
            id="container-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="Ej. Despensa secundaria"
            className="w-full rounded-xl border border-nido-border-strong px-3.5 py-2 text-xs text-nido-ink focus:border-nido-olive focus:outline-none"
          />
        </div>
      </form>
    </Modal>
  );
};
