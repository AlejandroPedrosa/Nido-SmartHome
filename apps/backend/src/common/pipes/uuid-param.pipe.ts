import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';

/**
 * Valida que un parámetro de ruta sea un UUID v4 (los ids que genera
 * `gen_random_uuid()`), con mensaje en español.
 *
 * @example
 * findOne(@Param('id', uuidParam('id')) id: string) { ... }
 */
export function uuidParam(name: string): ParseUUIDPipe {
  return new ParseUUIDPipe({
    version: '4',
    exceptionFactory: () =>
      new BadRequestException(`${name} debe ser un UUID válido`),
  });
}
