import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { PG_POOL } from '../database';
import {
  LIST_SUMMARY_COLUMNS,
  ShoppingListDetail,
  ShoppingListItem,
  ShoppingListSummary,
} from './interfaces/shopping-list.interface';

type Queryable = Pick<Pool | PoolClient, 'query'>;

/** RF-12 a RF-14: listas de compras de reposición. */
@Injectable()
export class ShoppingService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /** Historial del usuario: la lista activa primero, luego por fecha. */
  async findAll(userId: string): Promise<ShoppingListSummary[]> {
    const { rows } = await this.pool.query<ShoppingListSummary>(
      `SELECT ${LIST_SUMMARY_COLUMNS}
         FROM shopping_lists l
        WHERE l.user_id = $1
        ORDER BY l.is_purchased, l.created_at DESC`,
      [userId],
    );
    return rows;
  }

  /** Lista con sus ítems. 404 si no existe o es ajena (MT-03). */
  async findOne(userId: string, listId: string): Promise<ShoppingListDetail> {
    return this.loadList(this.pool, userId, listId);
  }

  /**
   * Carga una lista con sus ítems usando el cliente indicado, para poder
   * devolver el estado final desde dentro de una transacción.
   */
  protected async loadList(
    db: Queryable,
    userId: string,
    listId: string,
  ): Promise<ShoppingListDetail> {
    const list = await db.query<ShoppingListSummary>(
      `SELECT ${LIST_SUMMARY_COLUMNS}
         FROM shopping_lists l
        WHERE l.id = $1 AND l.user_id = $2`,
      [listId, userId],
    );
    if (list.rows.length === 0) {
      throw new NotFoundException('Lista de compras no encontrada');
    }

    const items = await db.query<ShoppingListItem>(
      `SELECT i.product_id, p.name AS product_name, p.unit,
              i.suggested_quantity, i.purchased, p.current_stock, p.min_stock
         FROM shopping_list_items i
         JOIN products p ON p.id = i.product_id
        WHERE i.shopping_list_id = $1 AND p.user_id = $2
        ORDER BY i.purchased, LOWER(p.name)`,
      [listId, userId],
    );

    return { ...list.rows[0], items: items.rows };
  }
}
