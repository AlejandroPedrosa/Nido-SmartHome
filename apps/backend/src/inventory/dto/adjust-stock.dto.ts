import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  NotEquals,
} from 'class-validator';

/** Máximo representable por DECIMAL(10, 2). */
export const MAX_QUANTITY = 99_999_999.99;

// Los decoradores se evalúan de abajo hacia arriba (ver login.dto.ts).
export class AdjustStockDto {
  @IsUUID('4', { message: 'product_id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'product_id es obligatorio' })
  product_id!: string;

  /** Con signo: positivo = entrada, negativo = salida (RS-06). */
  @Max(MAX_QUANTITY, { message: 'La cantidad es demasiado grande' })
  @Min(-MAX_QUANTITY, { message: 'La cantidad es demasiado grande' })
  @NotEquals(0, { message: 'La cantidad no puede ser 0' })
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'La cantidad debe ser un número con hasta 2 decimales' },
  )
  @IsNotEmpty({ message: 'quantity_change es obligatorio' })
  quantity_change!: number;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MaxLength(500, { message: 'El motivo no puede superar 500 caracteres' })
  @IsString({ message: 'El motivo debe ser texto' })
  @IsOptional()
  reason?: string;
}
