import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un controlador o handler como público: el guard global de
 * autenticación lo deja pasar sin token.
 * Usar solo en rutas que realmente lo necesitan (health, register, login,
 * refresh). Todo lo demás es privado por defecto.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
