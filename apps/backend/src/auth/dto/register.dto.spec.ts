import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { RegisterDto } from './register.dto';

const validate = (payload: Record<string, unknown>) => {
  const dto = plainToInstance(RegisterDto, payload);
  return { dto, errors: validateSync(dto, { stopAtFirstError: true }) };
};

describe('RegisterDto', () => {
  it('acepta datos válidos y normaliza el email', () => {
    const { dto, errors } = validate({
      email: ' Ana@Test.com ',
      password: 'secreta',
    });

    expect(errors).toHaveLength(0);
    expect(dto.email).toBe('ana@test.com');
  });

  it('exige al menos 6 caracteres de contraseña', () => {
    const { errors } = validate({ email: 'ana@test.com', password: '12345' });

    expect(errors[0].constraints).toEqual({
      minLength: 'La contraseña debe tener al menos 6 caracteres',
    });
  });

  it('informa primero que el email es obligatorio', () => {
    const { errors } = validate({ password: 'secreta' });

    expect(errors[0].constraints).toEqual({
      isNotEmpty: 'El email es obligatorio',
    });
  });
});
