import { create } from 'zustand';
import { ApiError } from '@/lib/api';
import { containersService } from '@/services/containers';
import { productsService } from '@/services/products';
import type {
  CreateProductPayload,
  Product,
  ProductDetail,
  ProductQuery,
  UpdateProductPayload,
} from '@/types';

interface ProductsState {
  products: Product[];
  /** Mapa productId → nombres de contenedores (PR-01). */
  containerNamesByProductId: Record<string, string[]>;
  selectedProduct: ProductDetail | null;
  filters: ProductQuery;
  isLoading: boolean;
  error: string | null;
  setFilters: (filters: ProductQuery) => void;
  fetchProducts: () => Promise<void>;
  /** Arma el mapa de contenedores con GET /containers/:id (brecha PR-01). */
  fetchContainerMap: () => Promise<void>;
  fetchProductDetail: (id: string) => Promise<ProductDetail>;
  createProduct: (payload: CreateProductPayload, containerIds: string[]) => Promise<Product>;
  updateProduct: (
    id: string,
    payload: UpdateProductPayload,
    containerIds: string[],
    previousContainerIds: string[],
  ) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
}

async function syncContainers(
  productId: string,
  nextIds: string[],
  previousIds: string[],
): Promise<void> {
  const toAdd = nextIds.filter((id) => !previousIds.includes(id));
  const toRemove = previousIds.filter((id) => !nextIds.includes(id));
  await Promise.all([
    ...toAdd.map((containerId) => containersService.assignProduct(containerId, productId)),
    ...toRemove.map((containerId) => containersService.unassignProduct(containerId, productId)),
  ]);
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  containerNamesByProductId: {},
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

  fetchContainerMap: async () => {
    try {
      const containers = await containersService.list();
      const details = await Promise.all(containers.map((c) => containersService.getById(c.id)));
      const map: Record<string, string[]> = {};
      for (const detail of details) {
        for (const product of detail.products) {
          map[product.id] = [...(map[product.id] ?? []), detail.name];
        }
      }
      set({ containerNamesByProductId: map });
    } catch {
      // La columna de contenedores queda vacía; el listado de productos sigue.
    }
  },

  fetchProductDetail: async (id) => {
    const detail = await productsService.getById(id);
    set({ selectedProduct: detail });
    return detail;
  },

  createProduct: async (payload, containerIds) => {
    const product = await productsService.create(payload);
    if (containerIds.length > 0) {
      await syncContainers(product.id, containerIds, []);
    }
    await get().fetchProducts();
    await get().fetchContainerMap();
    return product;
  },

  updateProduct: async (id, payload, containerIds, previousContainerIds) => {
    const product = await productsService.update(id, payload);
    await syncContainers(id, containerIds, previousContainerIds);
    await get().fetchProducts();
    await get().fetchContainerMap();
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
