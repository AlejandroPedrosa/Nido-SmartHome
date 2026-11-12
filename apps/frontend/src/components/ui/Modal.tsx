import type { FC, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
};

export const Modal: FC<ModalProps> = ({ title, subtitle, onClose, children, footer, size = 'md' }) => {
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-0 z-50 flex items-center justify-center bg-nido-ink/40 p-4 backdrop-blur-xs"
        >
            <div
                className={`flex max-h-[90vh] w-full ${SIZE_CLASSES[size]} flex-col rounded-3xl border border-nido-border bg-nido-surface shadow-xl`}
            >
                <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
                    <div>
                        <h2 className="text-base font-bold text-nido-ink">{title}</h2>
                        {subtitle && <p className="mt-0.5 text-xs text-nido-muted">{subtitle}</p>}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="cursor-pointer rounded-lg p-1.5 text-nido-subtle hover:bg-nido-bg hover:text-nido-ink"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-2">{children}</div>

                {footer && <div className="flex justify-end gap-2 px-6 pt-4 pb-6">{footer}</div>}
            </div>
        </div>
    );
};
