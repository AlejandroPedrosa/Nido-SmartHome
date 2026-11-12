import { applyDecorators } from '@nestjs/common';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export const MAX_CONTAINERS_PER_PRODUCT = 50;

/**
 * `container_ids` de POST/PATCH /products: lista de UUIDs de contenedores
 * propios, sin repetidos. Si no se envía no se modifican las asignaciones;
 * `[]` desvincula el producto de todos; `null` se rechaza. La pertenencia
 * de los contenedores (MT-02) se valida en el servicio.
 *
 * `applyDecorators` los registra en orden, así que se listan en el orden en
 * que se evalúan (el inverso de apilarlos sobre la propiedad).
 */
export function IsContainerIds(): PropertyDecorator {
  return applyDecorators(
    ValidateIf((_object: unknown, value: unknown) => value !== undefined),
    IsArray({ message: 'container_ids debe ser una lista' }),
    ArrayMaxSize(MAX_CONTAINERS_PER_PRODUCT, {
      message: `container_ids no puede tener más de ${MAX_CONTAINERS_PER_PRODUCT} contenedores`,
    }),
    IsUUID('4', {
      each: true,
      message: 'Cada container_id debe ser un UUID válido',
    }),
    ArrayUnique({ message: 'container_ids no puede tener repetidos' }),
  );
}
