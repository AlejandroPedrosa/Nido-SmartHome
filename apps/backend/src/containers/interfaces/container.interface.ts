/** Contenedor con la cantidad de productos asignados (tarjetas de ContainerList). */
export interface Container {
  id: string;
  name: string;
  created_at: Date;
  product_count: number;
}

/**
 * Columnas de un contenedor `c`, con el conteo de productos asignados como
 * subconsulta (sirve en SELECT y en RETURNING).
 */
export const CONTAINER_COLUMNS = `c.id, c.name, c.created_at,
  (SELECT count(*)::int FROM product_containers pc
    WHERE pc.container_id = c.id) AS product_count`;
