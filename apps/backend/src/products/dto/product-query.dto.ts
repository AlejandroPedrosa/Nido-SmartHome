import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ToBoolean, TrimToNull } from '../../common/validators/transforms';

/** Filtros de GET /products (RF-07), todos opcionales y combinables. */
export class ProductQueryDto {
  /** Búsqueda parcial, sin distinguir mayúsculas. */
  @MaxLength(100, { message: 'name no puede superar 100 caracteres' })
  @IsString()
  @IsOptional()
  @TrimToNull()
  name?: string | null;

  /** Categoría exacta, sin distinguir mayúsculas. */
  @MaxLength(50, { message: 'category no puede superar 50 caracteres' })
  @IsString()
  @IsOptional()
  @TrimToNull()
  category?: string | null;

  /** `true`: solo productos con current_stock < min_stock (RS-01). */
  @IsBoolean({ message: 'low_stock debe ser true o false' })
  @IsOptional()
  @ToBoolean()
  low_stock?: boolean;

  @IsUUID('4', { message: 'container_id debe ser un UUID válido' })
  @IsOptional()
  container_id?: string;
}
