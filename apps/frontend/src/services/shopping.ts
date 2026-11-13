import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type { ShoppingListDetail, ShoppingListSummary } from '@/types';

export const shoppingService = {
  list(): Promise<ShoppingListSummary[]> {
    return apiGet<ShoppingListSummary[]>('/shopping/lists');
  },

  getById(id: string): Promise<ShoppingListDetail> {
    return apiGet<ShoppingListDetail>(`/shopping/lists/${id}`);
  },

  /**
   * RF-12 / LC-06: lista activa sincronizada. `[]` solo si no hay faltantes y
   * no queda lista activa; si conserva ítems comprados, se devuelve igual.
   */
  generate(): Promise<ShoppingListDetail | []> {
    return apiPost<ShoppingListDetail | []>('/shopping/lists/generate');
  },

  setItemPurchased(
    listId: string,
    productId: string,
    purchased: boolean,
  ): Promise<ShoppingListDetail> {
    return apiPatch<ShoppingListDetail>(`/shopping/lists/${listId}/items/${productId}`, {
      purchased,
    });
  },

  /** LC-07: quita un ítem de la lista activa (204). Si queda vacía, se elimina. */
  removeItem(listId: string, productId: string): Promise<void> {
    return apiDelete(`/shopping/lists/${listId}/items/${productId}`);
  },

  purchase(listId: string): Promise<ShoppingListDetail> {
    return apiPost<ShoppingListDetail>(`/shopping/lists/${listId}/purchase`);
  },
};
