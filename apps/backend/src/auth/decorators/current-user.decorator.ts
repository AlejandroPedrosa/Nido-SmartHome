import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../interfaces/authenticated-user.interface';

/**
 * Inyecta el usuario autenticado (o una de sus propiedades) en un handler.
 *
 * @example
 * findAll(@CurrentUser('id') userId: string) { ... }
 * me(@CurrentUser() user: AuthenticatedUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (
    property: keyof AuthenticatedUser | undefined,
    context: ExecutionContext,
  ) => {
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return property ? user?.[property] : user;
  },
);
