import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DatabaseError } from 'pg';
import { mapPgError } from './pg-error.mapper';

/**
 * Filtro global para errores de PostgreSQL.
 *
 * Los servicios no necesitan capturar violaciones de constraints: el error
 * sube hasta acá (después del ROLLBACK de `withTransaction`) y se traduce a
 * la respuesta HTTP que define la documentación (400 / 404 / 409).
 * El cuerpo sigue el formato estándar de NestJS:
 * `{ statusCode, error, message }`.
 */
@Catch(DatabaseError)
export class PgExceptionFilter implements ExceptionFilter<DatabaseError> {
  private readonly logger = new Logger(PgExceptionFilter.name);

  catch(exception: DatabaseError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const mapped = mapPgError(exception);

    if (!mapped) {
      // Error no contemplado: se registra completo y se responde genérico.
      this.logger.error(
        `Error de base de datos no controlado [${exception.code}]: ${exception.message}`,
        exception.stack,
      );
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Error interno del servidor',
      });
      return;
    }

    this.logger.debug(
      `[${exception.code}] ${exception.constraint ?? '-'} → ${mapped.status}`,
    );
    response.status(mapped.status).json({
      statusCode: mapped.status,
      error: HTTP_REASON[mapped.status] ?? 'Error',
      message: mapped.message,
    });
  }
}

const HTTP_REASON: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.CONFLICT]: 'Conflict',
};
