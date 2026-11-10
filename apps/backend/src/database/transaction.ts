import { Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

const logger = new Logger('Transaction');

/**
 * Ejecuta `work` dentro de una transacción ACID.
 *
 * - Toma un cliente del pool, ejecuta `BEGIN`, corre `work(client)` y hace
 *   `COMMIT` si todo salió bien.
 * - Ante cualquier error hace `ROLLBACK` y relanza el error original, para
 *   que los filtros de excepciones lo traduzcan al código HTTP adecuado.
 * - Siempre devuelve el cliente al pool. Si el `ROLLBACK` falla, el cliente
 *   se descarta (puede haber quedado en un estado inconsistente).
 *
 * Propagación: si se pasa `existingClient`, `work` se ejecuta sobre esa
 * transacción ya abierta (sin BEGIN/COMMIT propios). Así un servicio
 * orquestador (p. ej. RecipesService) puede compartir su transacción con
 * InventoryService.
 *
 * @example
 * await withTransaction(this.pool, async (client) => {
 *   await client.query('UPDATE products SET ...');
 *   await client.query('INSERT INTO inventory_movements ...');
 * });
 */
export async function withTransaction<T>(
  pool: Pool,
  work: (client: PoolClient) => Promise<T>,
  existingClient?: PoolClient,
): Promise<T> {
  if (existingClient) {
    return work(existingClient);
  }

  const client = await pool.connect();
  let releaseError: Error | undefined;

  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      releaseError = rollbackError as Error;
      logger.error(`Falló el ROLLBACK: ${releaseError.message}`);
    }
    throw error;
  } finally {
    // release(error) destruye el cliente en lugar de devolverlo al pool.
    client.release(releaseError);
  }
}
