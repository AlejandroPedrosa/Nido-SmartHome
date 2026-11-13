import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { CurrentUser } from './current-user.decorator';

type ParamFactory = (data: unknown, context: ExecutionContext) => unknown;

/** Obtiene la función interna de un param decorator de NestJS. */
function getFactory(): ParamFactory {
  class TestController {
    handler(@CurrentUser() _user: unknown): void {}
  }
  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestController,
    'handler',
  ) as Record<string, { factory: ParamFactory }>;
  return Object.values(metadata)[0].factory;
}

describe('CurrentUser', () => {
  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'ana@test.com',
    accessToken: 'jwt',
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
  const factory = getFactory();

  it('devuelve el usuario completo sin argumento', () => {
    expect(factory(undefined, context)).toEqual(user);
  });

  it('devuelve una propiedad puntual', () => {
    expect(factory('id', context)).toBe('user-1');
    expect(factory('email', context)).toBe('ana@test.com');
  });
});
