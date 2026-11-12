import type { FC } from 'react';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { StockStatus } from '@/mocks/inventory';

const BADGES: Record<StockStatus, { label: string; classes: string; Icon: typeof AlertCircle }> = {
    ok: { label: 'OK', classes: 'bg-nido-sage-bg text-nido-sage-text', Icon: CheckCircle2 },
    low: { label: 'Bajo mínimo', classes: 'bg-nido-terracotta-bg text-nido-terracotta-text', Icon: AlertCircle },
    out: { label: 'Sin stock', classes: 'border border-nido-terracotta-border bg-nido-terracotta-bg text-nido-terracotta-text', Icon: XCircle },
};

export const StockBadge: FC<{ status: StockStatus }> = ({ status }) => {
    const { label, classes, Icon } = BADGES[status];
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes}`}>
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
};
