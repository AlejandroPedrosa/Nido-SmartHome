import { HttpStatus } from '@nestjs/common';

/** Códigos SQLSTATE de PostgreSQL que la API traduce a respuestas HTTP. */
export const PgErrorCode = {
  UniqueViolation: '23505',
  ForeignKeyViolation: '23503',
  CheckViolation: '23514',
  NotNullViolation: '23502',
  InvalidTextRepresentation: '22P02',
  NumericValueOutOfRange: '22003',
  SerializationFailure: '40001',
  DeadlockDetected: '40P01',
} as const;

/** Campos relevantes de un error de `pg` (DatabaseError). */
export interface PgErrorLike {
  code?: string;
  constraint?: string;
  detail?: string;
}

export interface MappedPgError {
  status: HttpStatus;
  message: string;
}

/**
 * Mensajes por constraint, con los nombres reales del esquema
 * (docs/database/schema.sql). Si una constraint no figura acá se usa el
 * mensaje genérico de su código.
 */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  // Unicidad (regla UG-01)
  uq_products_user_name_ci: 'Ya existe un producto con ese nombre',
  uq_containers_user_name_ci: 'Ya existe un contenedor con ese nombre',
  uq_recipes_user_name_ci: 'Ya existe una receta con ese nombre',
  shopping_lists_one_active_per_user:
    'Ya existe una lista de compras activa para el usuario',
  product_containers_pkey: 'El producto ya está asignado a ese contenedor',
  recipe_ingredients_pkey: 'El ingrediente está repetido en la receta',
  shopping_list_items_pkey: 'El producto ya figura en la lista de compras',

  // Integridad referencial (regla RC-06)
  recipe_ingredients_product_id_fkey:
    'El producto es ingrediente de una o más recetas. Desvinculalo antes de eliminarlo',

  // Checks de dominio
  products_current_stock_check: 'El stock no puede ser negativo',
  products_min_stock_check: 'El stock mínimo no puede ser negativo',
  products_reorder_quantity_check:
    'La cantidad de reposición debe ser mayor a 0',
  products_unit_check: 'Unidad de medida no permitida',
  recipes_servings_check: 'Las porciones deben ser mayores a 0',
  recipe_ingredients_quantity_check:
    'La cantidad del ingrediente debe ser mayor a 0',
  inventory_movements_quantity_change_check:
    'La cantidad del movimiento no puede ser 0',
  inventory_movements_type_check: 'Tipo de movimiento no permitido',
  shopping_list_items_suggested_quantity_check:
    'La cantidad sugerida debe ser mayor a 0',
  shopping_lists_purchased_at_consistency:
    'Estado de la lista de compras inconsistente',
};

/**
 * Traduce un error de PostgreSQL a un status HTTP y un mensaje seguro para el
 * cliente (nunca expone SQL, nombres de tablas ni valores).
 * Devuelve `null` si el error no es uno de los contemplados (→ 500).
 */
export function mapPgError(error: PgErrorLike): MappedPgError | null {
  const byConstraint = (fallback: string): string =>
    (error.constraint && CONSTRAINT_MESSAGES[error.constraint]) || fallback;

  switch (error.code) {
    case PgErrorCode.UniqueViolation:
      return {
        status: HttpStatus.CONFLICT,
        message: byConstraint('El recurso ya existe'),
      };

    case PgErrorCode.ForeignKeyViolation:
      // "is still referenced" → se intenta borrar algo en uso (RESTRICT): 409.
      // "is not present" → se referencia algo inexistente: 404 (regla MT-03).
      if (error.detail?.includes('is still referenced')) {
        return {
          status: HttpStatus.CONFLICT,
          message: byConstraint('El recurso está en uso por otros registros'),
        };
      }
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'El recurso referenciado no existe',
      };

    case PgErrorCode.CheckViolation:
      return {
        status: HttpStatus.BAD_REQUEST,
        message: byConstraint('Los datos no cumplen las reglas del dominio'),
      };

    case PgErrorCode.NotNullViolation:
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Falta un campo obligatorio',
      };

    case PgErrorCode.InvalidTextRepresentation:
    case PgErrorCode.NumericValueOutOfRange:
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Formato o rango de dato inválido',
      };

    case PgErrorCode.SerializationFailure:
    case PgErrorCode.DeadlockDetected:
      return {
        status: HttpStatus.CONFLICT,
        message:
          'La operación entró en conflicto con otra simultánea. Intentá nuevamente',
      };

    default:
      return null;
  }
}
