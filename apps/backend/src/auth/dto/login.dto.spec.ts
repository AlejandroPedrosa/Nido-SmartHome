import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LoginDto } from './login.dto';

const validate = (payload: Record<string, unknown>) => {
  const dto = plainToInstance(LoginDto, payload);
  return { dto, errors: validateSync(dto) };
};

describe('LoginDto', () => {
  it('normaliza el email (trim + minúsculas)', () => {
    const { dto, errors } = validate({
      email: '  Ana@Test.COM ',
      password: 'secreta',
    });

    expect(errors).toHaveLength(0);
    expect(dto.email).toBe('ana@test.com');
  });

  it.each([
    ['email inválido', { email: 'no-es-email', password: 'x' }, 'email'],
    ['sin contraseña', { email: 'ana@test.com', password: '' }, 'password'],
    ['sin email', { password: 'x' }, 'email'],
  ])('rechaza %s', (_case, payload, property) => {
    const { errors } = validate(payload);

    expect(errors.map((e) => e.property)).toContain(property);
  });
});
