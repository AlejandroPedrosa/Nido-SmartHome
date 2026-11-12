import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateContainerDto, UpdateContainerDto } from './container-name.dto';

const check = (payload: Record<string, unknown>) => {
  const dto = plainToInstance(CreateContainerDto, payload);
  return {
    dto,
    messages: validateSync(dto, { stopAtFirstError: true }).flatMap((e) =>
      Object.values(e.constraints ?? {}),
    ),
  };
};

describe('CreateContainerDto / UpdateContainerDto', () => {
  it('recorta espacios del nombre', () => {
    const { dto, messages } = check({ name: '  Despensa  ' });

    expect(messages).toEqual([]);
    expect(dto.name).toBe('Despensa');
  });

  it.each([
    [{}, 'El nombre es obligatorio'],
    [{ name: '   ' }, 'El nombre es obligatorio'],
    [{ name: 12 }, 'El nombre debe ser texto'],
    [{ name: 'x'.repeat(51) }, 'El nombre no puede superar 50 caracteres'],
  ])('rechaza %j', (payload, message) => {
    expect(check(payload).messages).toEqual([message]);
  });

  it('el update exige el nombre igual que el create', () => {
    const errors = validateSync(plainToInstance(UpdateContainerDto, {}));

    expect(errors[0].property).toBe('name');
  });
});
