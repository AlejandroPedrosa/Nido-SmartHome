import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { MovementType } from '../interfaces/movement.interface';

export const DEFAULT_MOVEMENTS_LIMIT = 50;
export const MAX_MOVEMENTS_LIMIT = 200;

/** Paginación de los listados de movimientos (query string). */
export class PaginationQueryDto {
  @Max(MAX_MOVEMENTS_LIMIT, {
    message: `limit no puede superar ${MAX_MOVEMENTS_LIMIT}`,
  })
  @Min(1, { message: 'limit debe ser al menos 1' })
  @IsInt({ message: 'limit debe ser un número entero' })
  @Type(() => Number)
  @IsOptional()
  limit: number = DEFAULT_MOVEMENTS_LIMIT;

  @Min(0, { message: 'offset no puede ser negativo' })
  @IsInt({ message: 'offset debe ser un número entero' })
  @Type(() => Number)
  @IsOptional()
  offset: number = 0;
}

/** Filtros de GET /inventory/movements (todos opcionales). */
export class MovementQueryDto extends PaginationQueryDto {
  @IsUUID('4', { message: 'product_id debe ser un UUID válido' })
  @IsOptional()
  product_id?: string;

  @IsEnum(MovementType, {
    message: `type debe ser uno de: ${Object.values(MovementType).join(', ')}`,
  })
  @IsOptional()
  type?: MovementType;

  /** Desde (inclusive). Fecha `YYYY-MM-DD` o fecha y hora ISO 8601. */
  @IsISO8601({ strict: true }, { message: 'from debe ser una fecha ISO 8601' })
  @IsOptional()
  from?: string;

  /**
   * Hasta (inclusive). Si es solo fecha (`YYYY-MM-DD`) incluye el día
   * completo.
   */
  @IsISO8601({ strict: true }, { message: 'to debe ser una fecha ISO 8601' })
  @IsOptional()
  to?: string;
}
