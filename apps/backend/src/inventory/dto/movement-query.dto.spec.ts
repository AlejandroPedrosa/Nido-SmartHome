import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MovementQueryDto } from './movement-query.dto';

/** Simula el query string: todos los valores llegan como texto. */
const parse = (query: Record<string, string>) => {
  const dto = plainToInstance(MovementQueryDto, query);
  const errors = validateSync(dto, { stopAtFirstError: true });
  return {
    dto,
    messages: errors.flatMap((e) => Object.values(e.constraints ?? {})),
  };
};

describe('MovementQueryDto', () => {
  it('aplica paginación por defecto sin filtros', () => {
    const { dto, messages } = parse({});

    expect(messages).toEqual([]);
    expect(dto.limit).toBe(50);
    expect(dto.offset).toBe(0);
  });

  it('convierte limit y offset del query string a número', () => {
    const { dto, messages } = parse({ limit: '10', offset: '30' });

    expect(messages).toEqual([]);
    expect(dto.limit).toBe(10);
    expect(dto.offset).toBe(30);
  });

  it('acepta todos los filtros válidos', () => {
    expect(
      parse({
        product_id: '3f1c2b9e-8d4a-4f6b-9c2e-1a2b3c4d5e6f',
        type: 'recipe_consumption',
        from: '2026-11-01',
        to: '2026-11-10T23:59:59Z',
      }).messages,
    ).toEqual([]);
  });

  it.each([
    [
      { type: 'regalo' },
      'type debe ser uno de: manual, recipe_consumption, shopping',
    ],
    [{ from: '10/11/2026' }, 'from debe ser una fecha ISO 8601'],
    [{ to: '2026-13-01' }, 'to debe ser una fecha ISO 8601'],
    [{ limit: '500' }, 'limit no puede superar 200'],
    [{ limit: '0' }, 'limit debe ser al menos 1'],
    [{ limit: 'diez' }, 'limit debe ser un número entero'],
    [{ offset: '-1' }, 'offset no puede ser negativo'],
    [{ product_id: 'abc' }, 'product_id debe ser un UUID válido'],
  ])('rechaza %j', (query, message) => {
    expect(parse(query).messages).toEqual([message]);
  });
});
