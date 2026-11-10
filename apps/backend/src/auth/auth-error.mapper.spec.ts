import { HttpStatus } from '@nestjs/common';
import { AuthApiError } from '@supabase/supabase-js';
import { mapAuthError } from './auth-error.mapper';

const apiError = (code: string, status = 400) =>
  new AuthApiError('mensaje interno', status, code);

describe('mapAuthError', () => {
  it.each([
    ['invalid_credentials', HttpStatus.UNAUTHORIZED],
    ['email_not_confirmed', HttpStatus.UNAUTHORIZED],
    ['refresh_token_not_found', HttpStatus.UNAUTHORIZED],
    ['refresh_token_already_used', HttpStatus.UNAUTHORIZED],
    ['session_not_found', HttpStatus.UNAUTHORIZED],
    ['over_request_rate_limit', HttpStatus.TOO_MANY_REQUESTS],
    ['over_email_send_rate_limit', HttpStatus.TOO_MANY_REQUESTS],
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

  it('nunca expone el mensaje original de Supabase', () => {
    expect(mapAuthError(apiError('invalid_credentials'), 'x').message).not.toBe(
      'mensaje interno',
    );
  });
});
