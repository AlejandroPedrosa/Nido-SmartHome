import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type {
  CreateProductPayload,
  LowStockProduct,
  ProductDetail,
  ProductQuery,
  UpdateProductPayload,
} from '@/types';

function toQuery(params?: ProductQuery): Record<string, string> | undefined {
  if (!params) return undefined;
  const query: Record<string, string> = {};
  if (params.name) query.name = params.name;
  if (params.category) query.category = params.category;
  if (params.container_id) query.container_id = params.container_id;
  if (params.low_stock !== undefined) query.low_stock = String(params.low_stock);
  return query;
}

export const productsService = {
  /** Cada producto incluye sus contenedores (PR-01). */
  list(params?: ProductQuery): Promise<ProductDetail[]> {
    return apiGet<ProductDetail[]>('/products', { params: toQuery(params) });
  },

  lowStock(): Promise<LowStockProduct[]> {
    return apiGet<LowStockProduct[]>('/products/low-stock');
  },

  getById(id: string): Promise<ProductDetail> {
    return apiGet<ProductDetail>(`/products/${id}`);
  },

  create(payload: CreateProductPayload): Promise<ProductDetail> {
    return apiPost<ProductDetail>('/products', payload);
  },

  update(id: string, payload: UpdateProductPayload): Promise<ProductDetail> {
    return apiPatch<ProductDetail>(`/products/${id}`, payload);
  },

  remove(id: string): Promise<void> {
    return apiDelete(`/products/${id}`);
  },
};
