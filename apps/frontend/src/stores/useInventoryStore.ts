import { create } from 'zustand';
import { inventoryService } from '@/services/inventory';
import type { AdjustStockPayload, MovementHistoryItem, MovementQuery } from '@/types';

interface InventoryState {
  movements: MovementHistoryItem[];
  productMovements: MovementHistoryItem[];
  isLoading: boolean;
  error: string | null;
  fetchMovements: (params?: MovementQuery) => Promise<void>;
  fetchProductMovements: (productId: string) => Promise<void>;
  adjust: (payload: AdjustStockPayload) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  movements: [],
  productMovements: [],
  isLoading: false,
  error: null,

  fetchMovements: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const movements = await inventoryService.listMovements(params);
      set({ movements, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'No se pudieron cargar los movimientos',
      });
    }
  },

  fetchProductMovements: async (productId) => {
    set({ isLoading: true, error: null });
    try {
      const productMovements = await inventoryService.listByProduct(productId);
      set({ productMovements, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'No se pudo cargar el historial',
      });
    }
  },

  adjust: async (payload) => {
    await inventoryService.adjust(payload);
  },
}));
