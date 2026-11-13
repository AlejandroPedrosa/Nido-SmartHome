import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { DatabaseError } from 'pg';
import { PgExceptionFilter } from './pg-exception.filter';

function buildDatabaseError(
  code: string,
  constraint?: string,
  detail?: string,
): DatabaseError {
  const error = new DatabaseError('mensaje interno de postgres', 0, 'error');
  error.code = code;
  error.constraint = constraint;
  error.detail = detail;
  return error;
}

describe('PgExceptionFilter', () => {
  const filter = new PgExceptionFilter();
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  it('responde 409 con mensaje de dominio ante un nombre duplicado', () => {
    filter.catch(buildDatabaseError('23505', 'uq_products_user_name_ci'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      error: 'Conflict',
      message: 'Ya existe un producto con ese nombre',
    });
  });

  it('responde 400 ante una violación de check', () => {
    filter.catch(
      buildDatabaseError('23514', 'products_current_stock_check'),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Bad Request' }),
    );
  });

  it('responde 500 genérico sin exponer el mensaje interno', () => {
    filter.catch(buildDatabaseError('08006'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Error interno del servidor',
    });
    expect(JSON.stringify(json.mock.calls)).not.toContain('postgres');
  });
});
