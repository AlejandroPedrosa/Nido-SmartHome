import { apiGet, apiPost } from '@/lib/api';
import type {
  AdjustStockPayload,
  InventoryMovement,
  MovementHistoryItem,
  MovementQuery,
} from '@/types';

export const inventoryService = {
  listMovements(params?: MovementQuery): Promise<MovementHistoryItem[]> {
    return apiGet<MovementHistoryItem[]>('/inventory/movements', { params });
  },

  listByProduct(productId: string): Promise<MovementHistoryItem[]> {
    return apiGet<MovementHistoryItem[]>(`/inventory/movements/${productId}`);
  },

  adjust(payload: AdjustStockPayload): Promise<InventoryMovement> {
    return apiPost<InventoryMovement>('/inventory/adjust', payload);
  },
};
