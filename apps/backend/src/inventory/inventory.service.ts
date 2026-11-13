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
  MovementFilters,
  MovementHistoryItem,
} from './interfaces/movement.interface';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

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

  /**
   * Historial de movimientos del usuario (CU-06), del más reciente al más
   * antiguo. `inventory_movements` no tiene `user_id`: el dueño se resuelve
   * con un JOIN a `products` (MT-02).
   */
  async findMovements(
    userId: string,
    filters: MovementFilters,
  ): Promise<MovementHistoryItem[]> {
    if (
      filters.from &&
      filters.to &&
      toEnd(filters.to) <= toStart(filters.from)
    ) {
      throw new BadRequestException('from debe ser anterior a to');
    }

    const params: unknown[] = [userId];
    const conditions = ['p.user_id = $1'];
    const addParam = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };

    if (filters.productId) {
      conditions.push(`m.product_id = ${addParam(filters.productId)}`);
    }
    if (filters.type) {
      conditions.push(`m.type = ${addParam(filters.type)}`);
    }
    if (filters.from) {
      conditions.push(`m.created_at >= ${addParam(toStart(filters.from))}`);
    }
    if (filters.to) {
      conditions.push(`m.created_at < ${addParam(toEnd(filters.to))}`);
    }

    const { rows } = await this.pool.query<MovementHistoryItem>(
      `SELECT m.id, m.product_id, p.name AS product_name, p.unit,
              m.quantity_change, m.type, m.reason, m.created_at
         FROM inventory_movements m
         JOIN products p ON p.id = m.product_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY m.created_at DESC, m.id
        LIMIT ${addParam(filters.limit)} OFFSET ${addParam(filters.offset)}`,
      params,
    );
    return rows;
  }

  /**
   * Historial de un producto puntual. Responde 404 si el producto no existe
   * o pertenece a otro usuario (MT-03), en lugar de una lista vacía.
   */
  async findProductMovements(
    userId: string,
    productId: string,
    pagination: Pick<MovementFilters, 'limit' | 'offset'>,
  ): Promise<MovementHistoryItem[]> {
    const { rowCount } = await this.pool.query(
      'SELECT 1 FROM products WHERE id = $1 AND user_id = $2',
      [productId, userId],
    );
    if (rowCount === 0) {
      throw new NotFoundException('Producto no encontrado');
    }
    return this.findMovements(userId, { productId, ...pagination });
  }

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

/** Inicio del rango: una fecha sola se interpreta como 00:00 UTC de ese día. */
function toStart(value: string): Date {
  return new Date(DATE_ONLY.test(value) ? `${value}T00:00:00.000Z` : value);
}

/**
 * Fin del rango (exclusivo). Una fecha sola incluye el día completo, así que
 * el límite es las 00:00 UTC del día siguiente; una fecha y hora es puntual
 * (se suma 1 ms para que sea inclusiva).
 */
function toEnd(value: string): Date {
  const date = toStart(value);
  if (DATE_ONLY.test(value)) {
    date.setUTCDate(date.getUTCDate() + 1);
  } else {
    date.setUTCMilliseconds(date.getUTCMilliseconds() + 1);
  }
  return date;
}
