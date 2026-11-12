import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database';
import {
  CreateContainerDto,
  UpdateContainerDto,
} from './dto/container-name.dto';
import { Container, CONTAINER_COLUMNS } from './interfaces/container.interface';

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
}
