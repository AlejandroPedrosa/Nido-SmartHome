import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { isAuthApiError, isAuthError } from '@supabase/supabase-js';

const logger = new Logger('SupabaseAuth');

/**
 * Traduce errores de Supabase Auth a excepciones HTTP con mensajes en español.
 * Nunca reenvía el mensaje original de Supabase al cliente, pero sí lo
 * registra en el log cuando el caso no es uno de los esperados, para poder
 * diagnosticarlo (p. ej. un fallo al enviar el email de confirmación).
 */
export function mapAuthError(error: unknown, fallback: string): HttpException {
  if (!isAuthApiError(error)) {
    // Error de red, timeout o respuesta inesperada de Supabase.
    logger.error(`Error no API de Supabase Auth: ${describe(error)}`);
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
    case 'user_already_exists':
    case 'email_exists':
      return new ConflictException('Ya existe una cuenta con ese email');
    case 'weak_password':
      return new BadRequestException(
        'La contraseña es demasiado débil. Usá al menos 6 caracteres',
      );
    case 'email_address_invalid':
    case 'validation_failed':
      return new BadRequestException('El email no es válido');
    case 'email_address_not_authorized':
      // El SMTP de prueba de Supabase solo envía a direcciones autorizadas.
      logger.warn(`Email de confirmación no autorizado: ${describe(error)}`);
      return new BadRequestException(
        'No se pudo enviar el email de confirmación a esa dirección',
      );
    case 'signup_disabled':
    case 'email_provider_disabled':
      return new ForbiddenException(
        'El registro de usuarios está deshabilitado',
      );
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      logger.warn(`Límite de Supabase alcanzado: ${describe(error)}`);
      return new HttpException(
        'Demasiados intentos. Esperá unos minutos',
        HttpStatus.TOO_MANY_REQUESTS,
      );
  }

  if (error.status >= 500) {
    logger.error(`Error interno de Supabase Auth: ${describe(error)}`);
    return new ServiceUnavailableException(
      'El servicio de autenticación no está disponible',
    );
  }

  logger.warn(`Error de Supabase Auth no contemplado: ${describe(error)}`);
  return new UnauthorizedException(fallback);
}

function describe(error: unknown): string {
  if (isAuthError(error)) {
    return `[status=${error.status} code=${error.code ?? '-'}] ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}
