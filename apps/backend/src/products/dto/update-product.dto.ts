import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Unit } from '../../common/enums/unit.enum';
import { IsQuantity } from '../../common/validators/quantity.decorators';
import { Trim, TrimToNull } from '../../common/validators/transforms';
import { UNIT_MESSAGE } from './create-product.dto';

/** Solo se valida el campo si vino en el body (incluido `null`, que se rechaza). */
const IfPresent = () =>
  ValidateIf((_object: unknown, value: unknown) => value !== undefined);

/**
 * PATCH /products/:id: actualiza metadatos. Todos los campos son opcionales.
 * El stock NO se edita acá (se modifica con movimientos de inventario): si se
 * envía `current_stock`, el ValidationPipe lo rechaza por no estar declarado.
 *
 * `category` y `reorder_quantity` admiten `null` para borrarlos; el resto no.
 */
export class UpdateProductDto {
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @IfPresent()
  @Trim()
  name?: string;

  @MaxLength(50, { message: 'La categoría no puede superar 50 caracteres' })
  @IsString({ message: 'La categoría debe ser texto' })
  @IsOptional()
  @TrimToNull()
  category?: string | null;

  @IsEnum(Unit, { message: UNIT_MESSAGE })
  @IfPresent()
  unit?: Unit;

  @IsQuantity('min_stock', { min: 'zero' })
  @IfPresent()
  min_stock?: number;

  @IsQuantity('reorder_quantity', { min: 'positive' })
  @IsOptional()
  reorder_quantity?: number | null;
}
