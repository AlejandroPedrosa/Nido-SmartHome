import {
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { isAuthApiError } from '@supabase/supabase-js';

/**
 * Traduce errores de Supabase Auth a excepciones HTTP con mensajes en español.
 * Nunca reenvía el mensaje original de Supabase al cliente.
 */
export function mapAuthError(error: unknown, fallback: string): HttpException {
  if (!isAuthApiError(error)) {
    // Error de red o respuesta inesperada de Supabase.
    return new ServiceUnavailableException(
      'El servicio de autenticación no está disponible',
    );
  }

  switch (error.code) {
    case 'invalid_credentials':
      return new UnauthorizedException('Email o contraseña incorrectos');
    case 'email_not_confirmed':
      return new UnauthorizedException(
        'Debés confirmar tu email antes de iniciar sesión',
      );
    case 'refresh_token_not_found':
    case 'refresh_token_already_used':
    case 'session_not_found':
    case 'session_expired':
      return new UnauthorizedException(
        'La sesión expiró. Iniciá sesión nuevamente',
      );
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return new HttpException(
        'Demasiados intentos. Esperá unos minutos',
        HttpStatus.TOO_MANY_REQUESTS,
      );
  }

  if (error.status >= 500) {
    return new ServiceUnavailableException(
      'El servicio de autenticación no está disponible',
    );
  }
  return new UnauthorizedException(fallback);
}
