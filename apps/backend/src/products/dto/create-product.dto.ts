import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DEFAULT_UNIT, Unit } from '../../common/enums/unit.enum';
import { IsQuantity } from '../../common/validators/quantity.decorators';
import { Trim, TrimToNull } from '../../common/validators/transforms';

export const UNIT_MESSAGE = `unit debe ser una de: ${Object.values(Unit).join(', ')}`;

// Los decoradores se evalúan de abajo hacia arriba (ver login.dto.ts).
export class CreateProductDto {
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Trim()
  name!: string;

  /** Categoría libre (ej. "Alimentos", "Limpieza"). Vacío = sin categoría. */
  @MaxLength(50, { message: 'La categoría no puede superar 50 caracteres' })
  @IsString({ message: 'La categoría debe ser texto' })
  @IsOptional()
  @TrimToNull()
  category?: string | null;

  /** UN-03: si no se informa, se usa 'unidad'. */
  @IsEnum(Unit, { message: UNIT_MESSAGE })
  @IsOptional()
  unit: Unit = DEFAULT_UNIT;

  /** Stock inicial. Si es > 0 se registra un movimiento de auditoría. */
  @IsQuantity('current_stock', { min: 'zero' })
  @IsOptional()
  current_stock: number = 0;

  /** RS-01: umbral de reposición. */
  @IsQuantity('min_stock', { min: 'zero' })
  @IsOptional()
  min_stock: number = 0;

  /** RS-02: cantidad fija de reposición. `null` = se sugiere lo que falta para el mínimo. */
  @IsQuantity('reorder_quantity', { min: 'positive' })
  @IsOptional()
  reorder_quantity?: number | null;
}
