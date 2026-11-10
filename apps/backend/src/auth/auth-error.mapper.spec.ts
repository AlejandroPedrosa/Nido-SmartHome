import { HttpStatus, Logger } from '@nestjs/common';
import { AuthApiError } from '@supabase/supabase-js';
import { mapAuthError } from './auth-error.mapper';

const apiError = (code: string, status = 400) =>
  new AuthApiError('mensaje interno', status, code);

describe('mapAuthError', () => {
  let errorLog: jest.SpyInstance;
  let warnLog: jest.SpyInstance;

  beforeEach(() => {
    errorLog = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    warnLog = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['invalid_credentials', HttpStatus.UNAUTHORIZED],
    ['email_not_confirmed', HttpStatus.UNAUTHORIZED],
    ['refresh_token_not_found', HttpStatus.UNAUTHORIZED],
    ['refresh_token_already_used', HttpStatus.UNAUTHORIZED],
    ['session_not_found', HttpStatus.UNAUTHORIZED],
    ['over_request_rate_limit', HttpStatus.TOO_MANY_REQUESTS],
    ['over_email_send_rate_limit', HttpStatus.TOO_MANY_REQUESTS],
    ['email_address_not_authorized', HttpStatus.BAD_REQUEST],
  ])('%s → %i', (code, status) => {
    expect(mapAuthError(apiError(code), 'fallback').getStatus()).toBe(status);
  });

  it('usa el mensaje de respaldo para códigos 4xx desconocidos', () => {
    const exception = mapAuthError(apiError('otro_codigo'), 'Mensaje propio');

    expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(exception.message).toBe('Mensaje propio');
  });

  it('responde 503 ante errores 5xx de Supabase', () => {
    expect(
      mapAuthError(apiError('unexpected_failure', 502), 'x').getStatus(),
    ).toBe(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('responde 503 ante errores de red (no AuthApiError)', () => {
    expect(mapAuthError(new TypeError('fetch failed'), 'x').getStatus()).toBe(
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  });

  it('registra en el log el error original de un 5xx (p. ej. fallo de SMTP)', () => {
    const error = new AuthApiError(
      'Error sending confirmation email',
      500,
      'unexpected_failure',
    );

    mapAuthError(error, 'x');

    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining('Error sending confirmation email'),
    );
  });

  it('registra en el log los errores de red', () => {
    mapAuthError(new TypeError('fetch failed'), 'x');

    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining('fetch failed'),
    );
  });

  it('no registra nada para errores esperados como credenciales inválidas', () => {
    mapAuthError(apiError('invalid_credentials'), 'x');

    expect(errorLog).not.toHaveBeenCalled();
    expect(warnLog).not.toHaveBeenCalled();
  });

  it('nunca expone el mensaje original de Supabase', () => {
    expect(mapAuthError(apiError('invalid_credentials'), 'x').message).not.toBe(
      'mensaje interno',
    );
  });
});
