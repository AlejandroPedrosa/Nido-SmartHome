import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { DEFAULT_UNIT } from '../common/enums/unit.enum';
import { PG_POOL, withTransaction } from '../database';
import { InventoryService, MovementType } from '../inventory';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import {
  LowStockProduct,
  Product,
  PRODUCT_COLUMNS,
  ProductContainer,
  ProductDetail,
  ProductRow,
  toLowStockProduct,
  toProduct,
} from './interfaces/product.interface';

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
   */
  async create(userId: string, dto: CreateProductDto): Promise<Product> {
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

      return toProduct(product);
    });
  }

  /**
   * RF-07: productos del usuario, ordenados por nombre. Filtros combinables:
   * nombre parcial, categoría exacta, stock bajo y contenedor asignado.
   * `low_stock=false` no filtra (equivale a no enviarlo).
   */
  async findAll(userId: string, query: ProductQueryDto): Promise<Product[]> {
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

    const { rows } = await this.pool.query<ProductRow>(
      `SELECT ${PRODUCT_COLUMNS}
         FROM products p
        WHERE ${conditions.join(' AND ')}
        ORDER BY LOWER(p.name)`,
      params,
    );
    return rows.map(toProduct);
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
  async findOne(userId: string, productId: string): Promise<ProductDetail> {
    const { rows } = await this.pool.query<ProductRow>(
      `SELECT ${PRODUCT_COLUMNS} FROM products p WHERE p.id = $1 AND p.user_id = $2`,
      [productId, userId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Producto no encontrado');
    }

    const containers = await this.pool.query<ProductContainer>(
      `SELECT c.id, c.name
         FROM product_containers pc
         JOIN containers c ON c.id = pc.container_id
        WHERE pc.product_id = $1 AND c.user_id = $2
        ORDER BY LOWER(c.name)`,
      [productId, userId],
    );

    return { ...toProduct(rows[0]), containers: containers.rows };
  }
}
