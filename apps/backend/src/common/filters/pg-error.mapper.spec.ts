import { HttpStatus } from '@nestjs/common';
import { mapPgError, PgErrorCode } from './pg-error.mapper';

describe('mapPgError', () => {
  describe('unique_violation (23505) → 409', () => {
    it.each([
      ['uq_products_user_name_ci', 'Ya existe un producto con ese nombre'],
      ['uq_containers_user_name_ci', 'Ya existe un contenedor con ese nombre'],
      ['uq_recipes_user_name_ci', 'Ya existe una receta con ese nombre'],
      [
        'product_containers_pkey',
        'El producto ya está asignado a ese contenedor',
      ],
    ])('%s', (constraint, message) => {
      expect(
        mapPgError({ code: PgErrorCode.UniqueViolation, constraint }),
      ).toEqual({ status: HttpStatus.CONFLICT, message });
    });

    it('usa un mensaje genérico para constraints desconocidas', () => {
      expect(
        mapPgError({ code: PgErrorCode.UniqueViolation, constraint: 'otra' }),
      ).toEqual({
        status: HttpStatus.CONFLICT,
        message: 'El recurso ya existe',
      });
    });
  });

  describe('foreign_key_violation (23503)', () => {
    it('responde 409 al borrar un producto usado en recetas (RC-06)', () => {
      const result = mapPgError({
        code: PgErrorCode.ForeignKeyViolation,
        constraint: 'recipe_ingredients_product_id_fkey',
        detail:
          'Key (id)=(...) is still referenced from table "recipe_ingredients".',
      });

      expect(result?.status).toBe(HttpStatus.CONFLICT);
      expect(result?.message).toContain('ingrediente');
    });

    it('responde 404 al referenciar un registro inexistente (MT-03)', () => {
      const result = mapPgError({
        code: PgErrorCode.ForeignKeyViolation,
        constraint: 'product_containers_product_id_fkey',
        detail: 'Key (product_id)=(...) is not present in table "products".',
      });

      expect(result).toEqual({
        status: HttpStatus.NOT_FOUND,
        message: 'El recurso referenciado no existe',
      });
    });
  });

  describe('check_violation (23514) → 400', () => {
    it('traduce el stock negativo (RS-03)', () => {
      expect(
        mapPgError({
          code: PgErrorCode.CheckViolation,
          constraint: 'products_current_stock_check',
        }),
      ).toEqual({
        status: HttpStatus.BAD_REQUEST,
        message: 'El stock no puede ser negativo',
      });
    });

    it('usa un mensaje genérico para checks desconocidos', () => {
      expect(mapPgError({ code: PgErrorCode.CheckViolation })?.status).toBe(
        HttpStatus.BAD_REQUEST,
      );
    });
  });

  it.each([
    PgErrorCode.NotNullViolation,
    PgErrorCode.InvalidTextRepresentation,
    PgErrorCode.NumericValueOutOfRange,
  ])('responde 400 para el código %s', (code) => {
    expect(mapPgError({ code })?.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it.each([PgErrorCode.SerializationFailure, PgErrorCode.DeadlockDetected])(
    'responde 409 ante conflictos de concurrencia (%s)',
    (code) => {
      expect(mapPgError({ code })?.status).toBe(HttpStatus.CONFLICT);
    },
  );

  it('devuelve null para códigos no contemplados', () => {
    expect(mapPgError({ code: '08006' })).toBeNull();
    expect(mapPgError({})).toBeNull();
  });
});
