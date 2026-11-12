import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { getSuggestedQuantity } from '../common/utils/suggested-quantity';
import { PG_POOL, withTransaction } from '../database';
import { InventoryService, MovementType } from '../inventory';
import {
  LIST_SUMMARY_COLUMNS,
  ShoppingListDetail,
  ShoppingListItem,
  ShoppingListSummary,
} from './interfaces/shopping-list.interface';

type Queryable = Pick<Pool | PoolClient, 'query'>;

interface LowStockRow {
  id: string;
  current_stock: number;
  min_stock: number;
  reorder_quantity: number | null;
}

/** RF-12 a RF-14: listas de compras de reposición. */
@Injectable()
export class ShoppingService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * RF-14: confirma la compra en una única transacción (flujo 7.4).
   *
   * - Bloquea la lista: dos confirmaciones simultáneas se serializan y la
   *   segunda ve la lista ya cerrada → 409 (LC-04).
   * - 400 si no hay ítems marcados como comprados (LC-05).
   * - Suma al stock únicamente los ítems comprados (RS-05), cada uno con un
   *   movimiento `shopping` a través de InventoryService (AU-01).
   * - Archiva la lista (`is_purchased = true`, `purchased_at = NOW()`). Los
   *   ítems no comprados quedan en la lista archivada como registro; si
   *   siguen faltando, la próxima generación los incluye en una lista nueva.
   */
  async purchase(userId: string, listId: string): Promise<ShoppingListDetail> {
    return withTransaction(this.pool, async (client) => {
      await this.lockOpenList(client, userId, listId);

      const { rows: purchased } = await client.query<{
        product_id: string;
        suggested_quantity: number;
      }>(
        `SELECT product_id, suggested_quantity
           FROM shopping_list_items
          WHERE shopping_list_id = $1 AND purchased
          ORDER BY product_id`,
        [listId],
      );
      if (purchased.length === 0) {
        throw new BadRequestException(
          'No hay artículos marcados como comprados',
        );
      }

      for (const item of purchased) {
        await this.inventoryService.applyMovement(
          {
            userId,
            productId: item.product_id,
            quantityChange: item.suggested_quantity,
            type: MovementType.Shopping,
            reason: 'Compra confirmada',
          },
          client,
        );
      }

      await client.query(
        `UPDATE shopping_lists
            SET is_purchased = TRUE, purchased_at = NOW()
          WHERE id = $1`,
        [listId],
      );

      return this.loadList(client, userId, listId);
    });
  }

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

  /**
   * RF-12: genera o sincroniza la lista activa (flujo 7.3), en una
   * transacción:
   *
   * - LC-01 / LC-02: incluye los productos con current_stock < min_stock y
   *   la cantidad sugerida de RS-02.
   * - LC-03: como máximo una lista activa. Los ítems ya marcados como
   *   comprados se preservan tal cual; los pendientes se actualizan y se
   *   eliminan los que ya no están bajo el mínimo.
   * - LC-06: si no hay faltantes no se crea ninguna lista y se depuran los
   *   pendientes de la activa. Si la activa queda vacía se elimina y se
   *   responde un array vacío; si conserva ítems comprados, se devuelve.
   */
  async generate(userId: string): Promise<ShoppingListDetail | []> {
    return withTransaction(this.pool, async (client) => {
      const { rows: lowStock } = await client.query<LowStockRow>(
        `SELECT id, current_stock, min_stock, reorder_quantity
           FROM products
          WHERE user_id = $1 AND current_stock < min_stock`,
        [userId],
      );

      // Bloquea la lista activa: dos generaciones simultáneas se serializan.
      let listId = await this.findActiveListId(client, userId);

      if (lowStock.length === 0) {
        if (!listId) {
          return [];
        }
        await client.query(
          `DELETE FROM shopping_list_items
            WHERE shopping_list_id = $1 AND NOT purchased`,
          [listId],
        );
        // Si quedan ítems comprados la lista sobrevive y se devuelve, para
        // que el usuario pueda confirmar la compra.
        if (await this.deleteListIfEmpty(client, listId)) {
          return [];
        }
        return this.loadList(client, userId, listId);
      }

      if (!listId) {
        listId = await this.createActiveList(client, userId);
      }

      const productIds = lowStock.map((product) => product.id);
      const quantities = lowStock.map((product) =>
        getSuggestedQuantity({
          currentStock: product.current_stock,
          minStock: product.min_stock,
          reorderQuantity: product.reorder_quantity,
        }),
      );

      // Pendientes cuyo producto ya recuperó stock (LC-03).
      await client.query(
        `DELETE FROM shopping_list_items
          WHERE shopping_list_id = $1
            AND NOT purchased
            AND product_id <> ALL($2::uuid[])`,
        [listId, productIds],
      );

      // Inserta faltantes nuevos y actualiza la cantidad de los pendientes;
      // los ya comprados no se tocan.
      await client.query(
        `INSERT INTO shopping_list_items
                (shopping_list_id, product_id, suggested_quantity)
         SELECT $1, product_id, quantity
           FROM unnest($2::uuid[], $3::numeric[]) AS f(product_id, quantity)
         ON CONFLICT (shopping_list_id, product_id) DO UPDATE
            SET suggested_quantity = EXCLUDED.suggested_quantity
          WHERE NOT shopping_list_items.purchased`,
        [listId, productIds, quantities],
      );

      return this.loadList(client, userId, listId);
    });
  }

  /**
   * RF-13: marca o desmarca un ítem como comprado. La lista se bloquea para
   * no cruzarse con una confirmación de compra simultánea. 409 si la lista
   * ya fue confirmada; 404 si es ajena o el producto no está en ella.
   */
  async setItemPurchased(
    userId: string,
    listId: string,
    productId: string,
    purchased: boolean,
  ): Promise<ShoppingListDetail> {
    return withTransaction(this.pool, async (client) => {
      await this.lockOpenList(client, userId, listId);

      const { rowCount } = await client.query(
        `UPDATE shopping_list_items SET purchased = $3
          WHERE shopping_list_id = $1 AND product_id = $2`,
        [listId, productId, purchased],
      );
      if (rowCount === 0) {
        throw new NotFoundException('El producto no está en la lista');
      }

      return this.loadList(client, userId, listId);
    });
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

  /**
   * Bloquea una lista del usuario (FOR UPDATE) y exige que siga abierta.
   * 404 si no existe o es ajena; 409 si ya fue confirmada (LC-04).
   */
  protected async lockOpenList(
    client: PoolClient,
    userId: string,
    listId: string,
  ): Promise<void> {
    const { rows } = await client.query<{ is_purchased: boolean }>(
      `SELECT is_purchased FROM shopping_lists
        WHERE id = $1 AND user_id = $2
          FOR UPDATE`,
      [listId, userId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Lista de compras no encontrada');
    }
    if (rows[0].is_purchased) {
      throw new ConflictException('La lista de compras ya fue confirmada');
    }
  }

  /**
   * Elimina la lista si no le quedan ítems (no se guardan listas vacías).
   * Devuelve `true` si la eliminó.
   */
  private async deleteListIfEmpty(
    client: PoolClient,
    listId: string,
  ): Promise<boolean> {
    const { rowCount } = await client.query(
      `DELETE FROM shopping_lists l
        WHERE l.id = $1
          AND NOT EXISTS (SELECT 1 FROM shopping_list_items i
                           WHERE i.shopping_list_id = l.id)`,
      [listId],
    );
    return (rowCount ?? 0) > 0;
  }

  /** Id de la lista activa del usuario, bloqueada hasta el fin de la transacción. */
  private async findActiveListId(
    client: PoolClient,
    userId: string,
  ): Promise<string | null> {
    const { rows } = await client.query<{ id: string }>(
      `SELECT id FROM shopping_lists
        WHERE user_id = $1 AND NOT is_purchased
          FOR UPDATE`,
      [userId],
    );
    return rows[0]?.id ?? null;
  }

  /**
   * Crea la lista activa. Si otra petición la creó en el mismo instante, el
   * índice único parcial (`shopping_lists_one_active_per_user`) evita el
   * duplicado y se reutiliza la existente.
   */
  private async createActiveList(
    client: PoolClient,
    userId: string,
  ): Promise<string> {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO shopping_lists (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) WHERE is_purchased = FALSE DO NOTHING
    RETURNING id`,
      [userId],
    );
    if (rows[0]) {
      return rows[0].id;
    }
    const existing = await this.findActiveListId(client, userId);
    if (!existing) {
      throw new Error('No se pudo obtener la lista de compras activa');
    }
    return existing;
  }
}
