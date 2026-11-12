import type { Product } from '../../products/interfaces/product.interface';

/** Contenedor con sus conteos de productos (tarjetas de ContainerList). */
export interface Container {
  id: string;
  name: string;
  created_at: Date;
  product_count: number;
  /** Productos asignados bajo mínimo (RS-01): badge "N por reponer". */
  low_stock_count: number;
}

/** Detalle de un contenedor con sus productos asignados (ContainerDetail). */
export interface ContainerDetail extends Container {
  products: Product[];
}

/**
 * Columnas de un contenedor `c`, con el conteo de productos asignados y el
 * de los que están bajo mínimo (RS-01) como subconsultas (sirve en SELECT y
 * en RETURNING).
 */
export const CONTAINER_COLUMNS = `c.id, c.name, c.created_at,
  (SELECT count(*)::int FROM product_containers pc
    WHERE pc.container_id = c.id) AS product_count,
  (SELECT count(*)::int FROM product_containers pc
     JOIN products p ON p.id = pc.product_id
    WHERE pc.container_id = c.id
      AND p.current_stock < p.min_stock) AS low_stock_count`;
