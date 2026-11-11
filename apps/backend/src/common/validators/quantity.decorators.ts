import { applyDecorators } from '@nestjs/common';
import { IsNumber, Max, Min } from 'class-validator';

/** Máximo representable por DECIMAL(10, 2). */
export const MAX_QUANTITY = 99_999_999.99;

export interface QuantityOptions {
  /** `zero`: admite 0 (stock, mínimo). `positive`: exige > 0 (reposición, ingredientes). */
  min: 'zero' | 'positive';
}

/**
 * Valida una cantidad del dominio: número JSON (no texto), hasta 2 decimales
 * y dentro del rango de DECIMAL(10, 2). Los mensajes nombran el campo.
 *
 * `applyDecorators` registra en el orden dado, así que la primera validación
 * es el tipo y luego el rango (con `stopAtFirstError` solo se informa una).
 */
export function IsQuantity(field: string, { min }: QuantityOptions) {
  return applyDecorators(
    IsNumber(
      { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
      { message: `${field} debe ser un número con hasta 2 decimales` },
    ),
    min === 'zero'
      ? Min(0, { message: `${field} no puede ser negativo` })
      : Min(0.01, { message: `${field} debe ser mayor a 0` }),
    Max(MAX_QUANTITY, { message: `${field} es demasiado grande` }),
  );
}
