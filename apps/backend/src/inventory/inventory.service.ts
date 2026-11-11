import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { roundQuantity } from '../common/utils/suggested-quantity';
import { PG_POOL, withTransaction } from '../database';
import {
  ApplyMovementInput,
  ApplyMovementResult,
  InventoryMovement,
} from './interfaces/movement.interface';

/**
 * Único punto del sistema que modifica `products.current_stock`.
 *
 * Cada cambio de stock y su registro de auditoría se escriben en la misma
 * transacción (regla AU-01). Los servicios orquestadores (products, recipes,
 * shopping) pasan su `PoolClient` para que el movimiento forme parte de su
 * propia transacción; si no se pasa, se abre una nueva.
 */
@Injectable()
export class InventoryService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async applyMovement(
    input: ApplyMovementInput,
    client?: PoolClient,
  ): Promise<ApplyMovementResult> {
    const quantityChange = roundQuantity(input.quantityChange);
    if (quantityChange === 0) {
      throw new BadRequestException(
        'La cantidad del movimiento no puede ser 0',
      );
    }

    return withTransaction(
      this.pool,
      async (tx) => {
        // Actualización condicional: la fila queda bloqueada por el UPDATE y
        // la condición de no negatividad (RS-03 / RNF-04) se evalúa sobre el
        // valor vigente, por lo que es segura ante peticiones concurrentes.
        const updated = await tx.query<{ current_stock: number }>(
          `UPDATE products
              SET current_stock = current_stock + $3
            WHERE id = $1
              AND user_id = $2
              AND current_stock + $3 >= 0
          RETURNING current_stock`,
          [input.productId, input.userId, quantityChange],
        );

        if (updated.rowCount === 0) {
          await this.throwWhyNotUpdated(tx, input, quantityChange);
        }

        const inserted = await tx.query<InventoryMovement>(
          `INSERT INTO inventory_movements
                  (product_id, quantity_change, type, reason)
           VALUES ($1, $2, $3, $4)
        RETURNING id, product_id, quantity_change, type, reason, created_at`,
          [
            input.productId,
            quantityChange,
            input.type,
            input.reason?.trim() || null,
          ],
        );

        return {
          movement: inserted.rows[0],
          current_stock: updated.rows[0].current_stock,
        };
      },
      client,
    );
  }

  /**
   * Distingue por qué el UPDATE no afectó filas: el producto no existe o es
   * de otro usuario (404, regla MT-03) o el stock no alcanza (400).
   */
  private async throwWhyNotUpdated(
    tx: PoolClient,
    { productId, userId }: ApplyMovementInput,
    quantityChange: number,
  ): Promise<never> {
    const { rows } = await tx.query<{ current_stock: number; unit: string }>(
      'SELECT current_stock, unit FROM products WHERE id = $1 AND user_id = $2',
      [productId, userId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Producto no encontrado');
    }

    const { current_stock, unit } = rows[0];
    throw new BadRequestException(
      `Stock insuficiente: disponible ${current_stock} ${unit}, ` +
        `se intentó descontar ${Math.abs(quantityChange)} ${unit}`,
    );
  }
}
