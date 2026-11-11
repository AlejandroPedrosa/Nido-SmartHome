import 'reflect-metadata';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Unit } from '../../common/enums/unit.enum';
import { CreateProductDto } from './create-product.dto';
import { ProductQueryDto } from './product-query.dto';
import { UpdateProductDto } from './update-product.dto';

/** Valida como el ValidationPipe global (whitelist + stopAtFirstError). */
function check<T extends object>(
  cls: ClassConstructor<T>,
  payload: Record<string, unknown>,
) {
  const dto = plainToInstance(cls, payload);
  const errors = validateSync(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
    stopAtFirstError: true,
  });
  return {
    dto,
    messages: errors.flatMap((e) => Object.values(e.constraints ?? {})),
  };
}

describe('CreateProductDto', () => {
  it('aplica los valores por defecto (UN-03, stock y mínimo en 0)', () => {
    const { dto, messages } = check(CreateProductDto, { name: '  Fideos  ' });

    expect(messages).toEqual([]);
    expect(dto).toMatchObject({
      name: 'Fideos',
      unit: Unit.Unit,
      current_stock: 0,
      min_stock: 0,
    });
    expect(dto.reorder_quantity).toBeUndefined();
  });

  it('acepta el ejemplo del README', () => {
    const { dto, messages } = check(CreateProductDto, {
      name: 'Fideos Tallarines',
      category: ' Alimentos ',
      unit: 'g',
      current_stock: 750,
      min_stock: 500,
      reorder_quantity: 1000,
    });

    expect(messages).toEqual([]);
    expect(dto.category).toBe('Alimentos');
  });

  it('convierte una categoría vacía en null', () => {
    expect(
      check(CreateProductDto, { name: 'X', category: '   ' }).dto.category,
    ).toBeNull();
  });

  it.each([
    [{}, 'El nombre es obligatorio'],
    [{ name: 5 }, 'El nombre debe ser texto'],
    [{ name: '   ' }, 'El nombre es obligatorio'],
    [{ name: 'x'.repeat(101) }, 'El nombre no puede superar 100 caracteres'],
    [
      { name: 'X', unit: 'litros' },
      'unit debe ser una de: g, kg, ml, l, unidad, paquete, botella',
    ],
    [{ name: 'X', current_stock: -1 }, 'current_stock no puede ser negativo'],
    [
      { name: 'X', min_stock: 1.555 },
      'min_stock debe ser un número con hasta 2 decimales',
    ],
    [{ name: 'X', reorder_quantity: 0 }, 'reorder_quantity debe ser mayor a 0'],
    [
      { name: 'X', current_stock: 100_000_000 },
      'current_stock es demasiado grande',
    ],
    [{ name: 'X', user_id: 'otro' }, 'property user_id should not exist'],
  ])('rechaza %j', (payload, message) => {
    expect(check(CreateProductDto, payload).messages).toEqual([message]);
  });
});

describe('UpdateProductDto', () => {
  it('acepta un body vacío o parcial', () => {
    expect(check(UpdateProductDto, {}).messages).toEqual([]);
    expect(check(UpdateProductDto, { min_stock: 200 }).messages).toEqual([]);
  });

  it('permite borrar categoría y reorder_quantity con null', () => {
    const { dto, messages } = check(UpdateProductDto, {
      category: null,
      reorder_quantity: null,
    });

    expect(messages).toEqual([]);
    expect(dto.category).toBeNull();
    expect(dto.reorder_quantity).toBeNull();
  });

  it.each([
    [{ name: null }, 'El nombre no puede estar vacío'],
    [{ name: '' }, 'El nombre no puede estar vacío'],
    [
      { unit: null },
      'unit debe ser una de: g, kg, ml, l, unidad, paquete, botella',
    ],
    [{ min_stock: null }, 'min_stock debe ser un número con hasta 2 decimales'],
    [{ current_stock: 10 }, 'property current_stock should not exist'],
  ])('rechaza %j', (payload, message) => {
    expect(check(UpdateProductDto, payload).messages).toEqual([message]);
  });
});

describe('ProductQueryDto', () => {
  it('convierte low_stock del query string a boolean', () => {
    expect(check(ProductQueryDto, { low_stock: 'true' }).dto.low_stock).toBe(
      true,
    );
    expect(check(ProductQueryDto, { low_stock: 'false' }).dto.low_stock).toBe(
      false,
    );
  });

  it('ignora filtros de texto vacíos', () => {
    const { dto, messages } = check(ProductQueryDto, { name: '  ' });

    expect(messages).toEqual([]);
    expect(dto.name).toBeNull();
  });

  it.each([
    [{ low_stock: 'si' }, 'low_stock debe ser true o false'],
    [{ container_id: '123' }, 'container_id debe ser un UUID válido'],
  ])('rechaza %j', (query, message) => {
    expect(check(ProductQueryDto, query).messages).toEqual([message]);
  });
});
