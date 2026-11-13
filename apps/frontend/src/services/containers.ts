import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import type { Container, ContainerDetail } from '@/types';

export const containersService = {
  list(): Promise<Container[]> {
    return apiGet<Container[]>('/containers');
  },

  getById(id: string): Promise<ContainerDetail> {
    return apiGet<ContainerDetail>(`/containers/${id}`);
  },

  create(name: string): Promise<Container> {
    return apiPost<Container>('/containers', { name });
  },

  update(id: string, name: string): Promise<Container> {
    return apiPatch<Container>(`/containers/${id}`, { name });
  },

  remove(id: string): Promise<void> {
    return apiDelete(`/containers/${id}`);
  },

  assignProduct(containerId: string, productId: string): Promise<void> {
    return apiPost(`/containers/${containerId}/products`, { product_id: productId });
  },

  unassignProduct(containerId: string, productId: string): Promise<void> {
    return apiDelete(`/containers/${containerId}/products/${productId}`);
  },
};
