import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database';
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
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

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
