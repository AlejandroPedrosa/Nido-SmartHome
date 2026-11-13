import { create } from 'zustand';
import { ApiError } from '@/lib/api';
import { productsService } from '@/services/products';
import type {
  CreateProductPayload,
  ProductDetail,
  ProductQuery,
  UpdateProductPayload,
} from '@/types';

interface ProductsState {
  /** Listado con los contenedores de cada producto (PR-01). */
  products: ProductDetail[];
  selectedProduct: ProductDetail | null;
  filters: ProductQuery;
  isLoading: boolean;
  error: string | null;
  setFilters: (filters: ProductQuery) => void;
  fetchProducts: () => Promise<void>;
  fetchProductDetail: (id: string) => Promise<ProductDetail>;
  /** Alta con `container_ids` en el payload: producto y contenedores en una transacción. */
  createProduct: (payload: CreateProductPayload) => Promise<ProductDetail>;
  updateProduct: (id: string, payload: UpdateProductPayload) => Promise<ProductDetail>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  selectedProduct: null,
  filters: {},
  isLoading: false,
  error: null,

  setFilters: (filters) => set({ filters }),

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await productsService.list(get().filters);
      set({ products, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof ApiError ? error.message : 'No se pudieron cargar los productos',
      });
    }
  },

  fetchProductDetail: async (id) => {
    const detail = await productsService.getById(id);
    set({ selectedProduct: detail });
    return detail;
  },

  createProduct: async (payload) => {
    const product = await productsService.create(payload);
    await get().fetchProducts();
    return product;
  },

  updateProduct: async (id, payload) => {
    const product = await productsService.update(id, payload);
    await get().fetchProducts();
    return product;
  },

  deleteProduct: async (id) => {
    await productsService.remove(id);
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
      selectedProduct: state.selectedProduct?.id === id ? null : state.selectedProduct,
    }));
  },
}));
