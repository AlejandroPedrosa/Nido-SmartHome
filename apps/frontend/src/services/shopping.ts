import { apiGet, apiPatch, apiPost } from '@/lib/api';
import type { ShoppingListDetail, ShoppingListSummary } from '@/types';

export const shoppingService = {
  list(): Promise<ShoppingListSummary[]> {
    return apiGet<ShoppingListSummary[]>('/shopping/lists');
  },

  getById(id: string): Promise<ShoppingListDetail> {
    return apiGet<ShoppingListDetail>(`/shopping/lists/${id}`);
  },

  /** RF-12 / LC-06: lista activa o `[]` si no hay faltantes. */
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

  purchase(listId: string): Promise<ShoppingListDetail> {
    return apiPost<ShoppingListDetail>(`/shopping/lists/${listId}/purchase`);
  },
};
