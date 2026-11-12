import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DEFAULT_UNIT } from '../common/enums/unit.enum';
import { PG_POOL, withTransaction } from '../database';
import { InventoryService, MovementType } from '../inventory';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  LowStockProduct,
  PRODUCT_COLUMNS,
  PRODUCT_CONTAINERS_JSON,
  ProductContainer,
  ProductDetail,
  ProductDetailRow,
  ProductRow,
  toLowStockProduct,
  toProduct,
  toProductDetail,
} from './interfaces/product.interface';

/** Campos editables por PATCH (nunca `current_stock`). */
const UPDATABLE_FIELDS = [
  'name',
  'category',
  'unit',
  'min_stock',
  'reorder_quantity',
] as const;

type Queryable = Pick<Pool | PoolClient, 'query'>;

/** Escapa los comodines de LIKE para que la búsqueda sea literal. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * RF-03 / RF-04: crea un producto (flujo 7.1).
   *
   * El producto se inserta con stock 0 y, si se informó stock inicial, se
   * carga con un movimiento `manual` a través de InventoryService, en la
   * misma transacción. Así todo stock tiene su registro de auditoría (AU-01)
   * y InventoryService sigue siendo el único que modifica `current_stock`.
   * Un nombre duplicado (UG-01) lo traduce el filtro de errores a 409.
   * Si llega `container_ids`, las asignaciones (CT-01) se aplican en la
   * misma transacción: un contenedor ajeno responde 404 y no se crea nada.
   */
  async create(userId: string, dto: CreateProductDto): Promise<ProductDetail> {
    const initialStock = dto.current_stock ?? 0;

    return withTransaction(this.pool, async (client) => {
      const { rows } = await client.query<ProductRow>(
        `INSERT INTO products AS p
                (user_id, name, category, unit, min_stock, reorder_quantity)
         VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${PRODUCT_COLUMNS}`,
        [
          userId,
          dto.name,
          dto.category ?? null,
          dto.unit ?? DEFAULT_UNIT,
          dto.min_stock ?? 0,
          dto.reorder_quantity ?? null,
        ],
      );
      const product = rows[0];

      if (initialStock > 0) {
        const { current_stock } = await this.inventoryService.applyMovement(
          {
            userId,
            productId: product.id,
            quantityChange: initialStock,
            type: MovementType.Manual,
            reason: 'Stock inicial',
          },
          client,
        );
        product.current_stock = current_stock;
      }

      const containers = dto.container_ids?.length
        ? await this.setContainers(
            client,
            userId,
            product.id,
            dto.container_ids,
          )
        : [];

      return { ...toProduct(product), containers };
    });
  }

  /**
   * RF-07: productos del usuario, ordenados por nombre. Filtros combinables:
   * nombre parcial, categoría exacta, stock bajo y contenedor asignado.
   * `low_stock=false` no filtra (equivale a no enviarlo). Cada producto
   * incluye sus contenedores asignados (PR-01).
   */
  async findAll(
    userId: string,
    query: ProductQueryDto,
  ): Promise<ProductDetail[]> {
    const params: unknown[] = [userId];
    const conditions = ['p.user_id = $1'];
    const addParam = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };

    if (query.name) {
      conditions.push(
        `p.name ILIKE '%' || ${addParam(escapeLike(query.name))} || '%'`,
      );
    }
    if (query.category) {
      conditions.push(`LOWER(p.category) = LOWER(${addParam(query.category)})`);
    }
    if (query.low_stock === true) {
      conditions.push('p.current_stock < p.min_stock');
    }
    if (query.container_id) {
      // El contenedor también debe ser del usuario (MT-02).
      conditions.push(`EXISTS (
        SELECT 1 FROM product_containers pc
          JOIN containers c ON c.id = pc.container_id
         WHERE pc.product_id = p.id
           AND pc.container_id = ${addParam(query.container_id)}
           AND c.user_id = $1)`);
    }

    const { rows } = await this.pool.query<ProductDetailRow>(
      `SELECT ${PRODUCT_COLUMNS}, ${PRODUCT_CONTAINERS_JSON}
         FROM products p
        WHERE ${conditions.join(' AND ')}
        ORDER BY LOWER(p.name)`,
      params,
    );
    return rows.map(toProductDetail);
  }

  /**
   * Productos en reposición (RS-01: current_stock < min_stock) con la
   * cantidad sugerida (RS-02). Los de menor cobertura aparecen primero.
   */
  async findLowStock(userId: string): Promise<LowStockProduct[]> {
    const { rows } = await this.pool.query<ProductRow>(
      `SELECT ${PRODUCT_COLUMNS}
         FROM products p
        WHERE p.user_id = $1
          AND p.current_stock < p.min_stock
        ORDER BY p.current_stock / NULLIF(p.min_stock, 0), LOWER(p.name)`,
      [userId],
    );
    return rows.map(toLowStockProduct);
  }

  /** Detalle con contenedores asignados. 404 si no existe o es ajeno (MT-03). */
  async findOne(
    userId: string,
    productId: string,
    db: Queryable = this.pool,
  ): Promise<ProductDetail> {
    const { rows } = await db.query<ProductDetailRow>(
      `SELECT ${PRODUCT_COLUMNS}, ${PRODUCT_CONTAINERS_JSON}
         FROM products p
        WHERE p.id = $1 AND p.user_id = $2`,
      [productId, userId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Producto no encontrado');
    }
    return toProductDetail(rows[0]);
  }

  /**
   * RF-03: actualiza metadatos. Solo se modifican los campos enviados; el
   * stock no se edita acá (se usa POST /inventory/adjust). 404 si es ajeno,
   * 409 si el nuevo nombre ya existe (UG-01).
   *
   * Si llega `container_ids`, reemplaza las asignaciones (CT-01) en la misma
   * transacción: `[]` lo desvincula de todos y un contenedor ajeno responde
   * 404 sin aplicar ningún cambio.
   */
  async update(
    userId: string,
    productId: string,
    dto: UpdateProductDto,
  ): Promise<ProductDetail> {
    return withTransaction(this.pool, async (client) => {
      const params: unknown[] = [productId, userId];
      const assignments = UPDATABLE_FIELDS.filter(
        (field) => dto[field] !== undefined,
      ).map((field) => {
        params.push(dto[field]);
        return `${field} = $${params.length}`;
      });

      // Sin campos para actualizar igual se verifica la pertenencia y se
      // bloquea el producto mientras se reemplazan sus contenedores.
      const { rowCount } = await client.query(
        assignments.length > 0
          ? `UPDATE products SET ${assignments.join(', ')}
              WHERE id = $1 AND user_id = $2`
          : 'SELECT 1 FROM products WHERE id = $1 AND user_id = $2 FOR UPDATE',
        params,
      );
      if (rowCount === 0) {
        throw new NotFoundException('Producto no encontrado');
      }

      if (dto.container_ids !== undefined) {
        await this.setContainers(client, userId, productId, dto.container_ids);
      }

      return this.findOne(userId, productId, client);
    });
  }

  /**
   * RF-03: elimina el producto y, en cascada, su historial de movimientos,
   * sus asignaciones a contenedores y sus ítems de listas de compras.
   *
   * RC-06: si es ingrediente de alguna receta responde 409 indicando cuáles.
   * Se consulta antes de borrar para dar un mensaje útil; si una receta lo
   * incorpora justo en el medio, la FK `ON DELETE RESTRICT` igual impide el
   * borrado y el filtro global responde 409.
   */
  async remove(userId: string, productId: string): Promise<void> {
    const recipes = await this.pool.query<{ name: string }>(
      `SELECT r.name
         FROM recipe_ingredients ri
         JOIN recipes r ON r.id = ri.recipe_id
        WHERE ri.product_id = $1 AND r.user_id = $2
        ORDER BY LOWER(r.name)`,
      [productId, userId],
    );
    if (recipes.rows.length > 0) {
      const names = recipes.rows.map((r) => `"${r.name}"`).join(', ');
      throw new ConflictException(
        `No se puede eliminar: el producto es ingrediente de ${names}. Quitalo de esas recetas primero`,
      );
    }

    const { rowCount } = await this.pool.query(
      'DELETE FROM products WHERE id = $1 AND user_id = $2',
      [productId, userId],
    );
    if (rowCount === 0) {
      throw new NotFoundException('Producto no encontrado');
    }
  }

  /**
   * CT-01: deja al producto asignado exactamente a `containerIds`. Todos
   * deben ser contenedores del usuario (MT-02): si alguno no existe o es
   * ajeno responde 404 y la transacción se revierte. Devuelve los
   * contenedores asignados, ordenados por nombre.
   */
  private async setContainers(
    client: PoolClient,
    userId: string,
    productId: string,
    containerIds: string[],
  ): Promise<ProductContainer[]> {
    const { rows } = await client.query<ProductContainer>(
      `SELECT id, name FROM containers
        WHERE id = ANY($1::uuid[]) AND user_id = $2
        ORDER BY LOWER(name)`,
      [containerIds, userId],
    );
    if (rows.length !== containerIds.length) {
      throw new NotFoundException(
        'Uno o más contenedores no existen o no te pertenecen',
      );
    }

    await client.query(
      `DELETE FROM product_containers
        WHERE product_id = $1 AND container_id <> ALL($2::uuid[])`,
      [productId, containerIds],
    );
    if (containerIds.length > 0) {
      await client.query(
        `INSERT INTO product_containers (product_id, container_id)
         SELECT $1, unnest($2::uuid[])
         ON CONFLICT DO NOTHING`,
        [productId, containerIds],
      );
    }
    return rows;
  }
}
