import { create } from 'zustand';
import { ApiError } from '@/lib/api';
import { shoppingService } from '@/services/shopping';
import type { ShoppingListDetail, ShoppingListSummary } from '@/types';

interface ShoppingState {
  lists: ShoppingListSummary[];
  activeList: ShoppingListDetail | null;
  historyDetail: ShoppingListDetail | null;
  isLoading: boolean;
  error: string | null;
  notice: string | null;
  pendingCount: number;
  fetchLists: () => Promise<void>;
  loadActive: () => Promise<void>;
  generate: () => Promise<void>;
  setItemPurchased: (productId: string, purchased: boolean) => Promise<void>;
  purchase: () => Promise<void>;
  loadHistoryDetail: (id: string) => Promise<void>;
}

function pendingFrom(list: ShoppingListDetail | null): number {
  if (!list) return 0;
  return list.items.filter((i) => !i.purchased).length;
}

export const useShoppingStore = create<ShoppingState>((set, get) => ({
  lists: [],
  activeList: null,
  historyDetail: null,
  isLoading: false,
  error: null,
  notice: null,
  pendingCount: 0,

  fetchLists: async () => {
    set({ isLoading: true, error: null });
    try {
      const lists = await shoppingService.list();
      set({ lists, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof ApiError ? error.message : 'No se pudieron cargar las listas',
      });
    }
  },

  loadActive: async () => {
    set({ isLoading: true, error: null });
    try {
      const lists = await shoppingService.list();
      const activeSummary = lists.find((l) => !l.is_purchased) ?? null;
      const activeList = activeSummary
        ? await shoppingService.getById(activeSummary.id)
        : null;
      set({
        lists,
        activeList,
        pendingCount: pendingFrom(activeList),
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof ApiError ? error.message : 'No se pudo cargar la lista activa',
      });
    }
  },

  generate: async () => {
    set({ isLoading: true, error: null, notice: null });
    try {
      const result = await shoppingService.generate();
      if (Array.isArray(result)) {
        set({
          activeList: null,
          pendingCount: 0,
          isLoading: false,
          notice: 'Inventario completo: no hay productos por debajo del mínimo.',
        });
        await get().fetchLists();
        return;
      }
      set({
        activeList: result,
        pendingCount: pendingFrom(result),
        isLoading: false,
        notice: `Lista sincronizada con ${result.item_count} ${result.item_count === 1 ? 'faltante' : 'faltantes'}.`,
      });
      await get().fetchLists();
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof ApiError ? error.message : 'No se pudo sincronizar la lista',
      });
    }
  },

  setItemPurchased: async (productId, purchased) => {
    const current = get().activeList;
    if (!current) return;

    const optimistic: ShoppingListDetail = {
      ...current,
      items: current.items.map((item) =>
        item.product_id === productId ? { ...item, purchased } : item,
      ),
      purchased_count: current.items.filter((i) =>
        i.product_id === productId ? purchased : i.purchased,
      ).length,
    };
    set({ activeList: optimistic, pendingCount: pendingFrom(optimistic) });

    try {
      const updated = await shoppingService.setItemPurchased(current.id, productId, purchased);
      set({ activeList: updated, pendingCount: pendingFrom(updated) });
    } catch (error) {
      set({ activeList: current, pendingCount: pendingFrom(current) });
      throw error;
    }
  },

  purchase: async () => {
    const current = get().activeList;
    if (!current) return;
    await shoppingService.purchase(current.id);
    set({
      activeList: null,
      pendingCount: 0,
      notice: 'Compra confirmada: el stock se actualizó y la lista quedó archivada.',
    });
    await get().fetchLists();
  },

  loadHistoryDetail: async (id) => {
    const historyDetail = await shoppingService.getById(id);
    set({ historyDetail });
  },
}));
