import type { FC, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface ConfirmDialogProps {
    title: string;
    /** Texto principal explicando qué va a pasar. */
    description: ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    /** `danger` pinta el botón de confirmación en terracota (acciones destructivas). */
    tone?: 'primary' | 'danger';
    /** Mensaje de advertencia/bloqueo (ej. HTTP 409). Si `blocking`, deshabilita la confirmación. */
    warning?: string;
    blocking?: boolean;
    children?: ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
    title,
    description,
    confirmLabel,
    cancelLabel = 'Cancelar',
    tone = 'primary',
    warning,
    blocking = false,
    children,
    onConfirm,
    onCancel,
}) => {
    const confirmClasses =
        tone === 'danger'
            ? 'bg-nido-terracotta-text text-white hover:opacity-90'
            : 'bg-nido-olive text-white hover:bg-nido-olive-hover';

    return (
        <Modal
            title={title}
            size="sm"
            onClose={onCancel}
            footer={
                <>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="cursor-pointer rounded-xl border border-nido-border px-4 py-2 text-xs font-medium text-nido-secondary hover:bg-nido-bg"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={blocking}
                        className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                            blocking
                                ? 'cursor-not-allowed border border-nido-border bg-nido-bg text-nido-subtle'
                                : `cursor-pointer ${confirmClasses}`
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </>
            }
        >
            <div className="space-y-3 text-xs leading-relaxed text-nido-secondary">
                <p>{description}</p>
                {children}
                {warning && (
                    <div className="flex items-start gap-2 rounded-xl border border-nido-terracotta-border bg-nido-terracotta-bg p-3 text-nido-terracotta-text">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{warning}</span>
                    </div>
                )}
            </div>
        </Modal>
    );
};
