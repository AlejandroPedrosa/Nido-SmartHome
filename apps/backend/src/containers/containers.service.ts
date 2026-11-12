import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database';
import {
  CreateContainerDto,
  UpdateContainerDto,
} from './dto/container-name.dto';
import {
  PRODUCT_COLUMNS,
  ProductRow,
  toProduct,
} from '../products/interfaces/product.interface';
import {
  Container,
  CONTAINER_COLUMNS,
  ContainerDetail,
} from './interfaces/container.interface';

/**
 * RF-05: espacios físicos del hogar. Un nombre duplicado (UG-01) lo traduce
 * el filtro global a 409 a partir del índice `uq_containers_user_name_ci`.
 */
@Injectable()
export class ContainersService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findAll(userId: string): Promise<Container[]> {
    const { rows } = await this.pool.query<Container>(
      `SELECT ${CONTAINER_COLUMNS}
         FROM containers c
        WHERE c.user_id = $1
        ORDER BY LOWER(c.name)`,
      [userId],
    );
    return rows;
  }

  async create(userId: string, dto: CreateContainerDto): Promise<Container> {
    const { rows } = await this.pool.query<Container>(
      `INSERT INTO containers AS c (user_id, name)
       VALUES ($1, $2)
    RETURNING ${CONTAINER_COLUMNS}`,
      [userId, dto.name],
    );
    return rows[0];
  }

  async update(
    userId: string,
    containerId: string,
    dto: UpdateContainerDto,
  ): Promise<Container> {
    const { rows } = await this.pool.query<Container>(
      `UPDATE containers AS c
          SET name = $3
        WHERE c.id = $1 AND c.user_id = $2
    RETURNING ${CONTAINER_COLUMNS}`,
      [containerId, userId, dto.name],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Contenedor no encontrado');
    }
    return rows[0];
  }

  /**
   * CT-03: elimina el contenedor. Sus vínculos en `product_containers` se
   * borran en cascada; los productos conservan su stock y existencia.
   */
  async remove(userId: string, containerId: string): Promise<void> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM containers WHERE id = $1 AND user_id = $2',
      [containerId, userId],
    );
    if (rowCount === 0) {
      throw new NotFoundException('Contenedor no encontrado');
    }
  }

  /** Detalle con los productos asignados, ordenados por nombre. 404 si es ajeno. */
  async findOne(userId: string, containerId: string): Promise<ContainerDetail> {
    const container = await this.findOwned(userId, containerId);

    const { rows } = await this.pool.query<ProductRow>(
      `SELECT ${PRODUCT_COLUMNS}
         FROM product_containers pc
         JOIN products p ON p.id = pc.product_id
        WHERE pc.container_id = $1 AND p.user_id = $2
        ORDER BY LOWER(p.name)`,
      [containerId, userId],
    );

    return { ...container, products: rows.map(toProduct) };
  }

  /**
   * RF-06 / CT-01: asigna un producto del mismo usuario al contenedor. Un
   * producto puede estar en varios contenedores. 404 si el contenedor o el
   * producto son ajenos (MT-03); 409 si ya estaba asignado (lo traduce el
   * filtro global a partir de `product_containers_pkey`).
   */
  async assignProduct(
    userId: string,
    containerId: string,
    productId: string,
  ): Promise<ContainerDetail> {
    await this.findOwned(userId, containerId);

    const product = await this.pool.query(
      'SELECT 1 FROM products WHERE id = $1 AND user_id = $2',
      [productId, userId],
    );
    if (product.rowCount === 0) {
      throw new NotFoundException('Producto no encontrado');
    }

    await this.pool.query(
      'INSERT INTO product_containers (product_id, container_id) VALUES ($1, $2)',
      [productId, containerId],
    );

    return this.findOne(userId, containerId);
  }

  /** RF-06: quita el vínculo; el producto se conserva. */
  async unassignProduct(
    userId: string,
    containerId: string,
    productId: string,
  ): Promise<void> {
    await this.findOwned(userId, containerId);

    const { rowCount } = await this.pool.query(
      'DELETE FROM product_containers WHERE container_id = $1 AND product_id = $2',
      [containerId, productId],
    );
    if (rowCount === 0) {
      throw new NotFoundException(
        'El producto no está asignado a ese contenedor',
      );
    }
  }

  private async findOwned(
    userId: string,
    containerId: string,
  ): Promise<Container> {
    const { rows } = await this.pool.query<Container>(
      `SELECT ${CONTAINER_COLUMNS} FROM containers c WHERE c.id = $1 AND c.user_id = $2`,
      [containerId, userId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('Contenedor no encontrado');
    }
    return rows[0];
  }
}
