import type { FC } from 'react';
import { Home } from 'lucide-react';

interface NidoLogoProps {
    size?: 'sm' | 'md';
}

export const NidoLogo: FC<NidoLogoProps> = ({ size = 'md' }) => {
    const boxClasses = size === 'sm' ? 'h-7 w-7 rounded-lg' : 'h-8 w-8 rounded-lg';

    return (
        <div className="inline-flex items-center gap-2.5 select-none">
        <div
            className={`${boxClasses} flex items-center justify-center bg-nido-olive text-white shadow-xs`}
        >
            <Home className="h-4 w-4" strokeWidth={2.2} />
        </div>
        <span className="text-sm font-bold tracking-[0.22em] text-nido-ink">
            NIDO
        </span>
        </div>
    );
};