import { create } from 'zustand';
import { ApiError } from '@/lib/api';
import { containersService } from '@/services/containers';
import type { Container, ContainerDetail } from '@/types';

interface ContainersState {
  containers: Container[];
  selected: ContainerDetail | null;
  isLoading: boolean;
  error: string | null;
  fetchContainers: () => Promise<void>;
  fetchDetail: (id: string) => Promise<ContainerDetail>;
  create: (name: string) => Promise<Container>;
  rename: (id: string, name: string) => Promise<Container>;
  remove: (id: string) => Promise<void>;
  assignProducts: (containerId: string, nextProductIds: string[]) => Promise<void>;
  unassignProduct: (containerId: string, productId: string) => Promise<void>;
}

export const useContainersStore = create<ContainersState>((set, get) => ({
  containers: [],
  selected: null,
  isLoading: false,
  error: null,

  fetchContainers: async () => {
    set({ isLoading: true, error: null });
    try {
      const containers = await containersService.list();
      set({ containers, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof ApiError ? error.message : 'No se pudieron cargar los contenedores',
      });
    }
  },

  fetchDetail: async (id) => {
    const selected = await containersService.getById(id);
    set({ selected });
    return selected;
  },

  create: async (name) => {
    const container = await containersService.create(name);
    await get().fetchContainers();
    return container;
  },

  rename: async (id, name) => {
    const container = await containersService.update(id, name);
    await get().fetchContainers();
    return container;
  },

  remove: async (id) => {
    await containersService.remove(id);
    set((state) => ({
      containers: state.containers.filter((c) => c.id !== id),
      selected: state.selected?.id === id ? null : state.selected,
    }));
  },

  assignProducts: async (containerId, nextProductIds) => {
    const detail = get().selected?.id === containerId
      ? get().selected!
      : await containersService.getById(containerId);
    const currentIds = detail.products.map((p) => p.id);
    const toAdd = nextProductIds.filter((id) => !currentIds.includes(id));
    const toRemove = currentIds.filter((id) => !nextProductIds.includes(id));
    await Promise.all([
      ...toAdd.map((productId) => containersService.assignProduct(containerId, productId)),
      ...toRemove.map((productId) => containersService.unassignProduct(containerId, productId)),
    ]);
    await get().fetchDetail(containerId);
    await get().fetchContainers();
  },

  unassignProduct: async (containerId, productId) => {
    await containersService.unassignProduct(containerId, productId);
    await get().fetchDetail(containerId);
    await get().fetchContainers();
  },
}));
