import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateRecipeDto, UpdateRecipeDto } from './recipe.dto';

const P1 = '3f1c2b9e-8d4a-4f6b-9c2e-1a2b3c4d5e6f';
const P2 = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';

/** Mismo ValidationPipe que main.ts, para ver los mensajes reales (incluidos los anidados). */
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  stopAtFirstError: true,
});

async function validate<T>(
  metatype: new () => T,
  body: Record<string, unknown>,
): Promise<{ dto?: T; messages: string[] }> {
  try {
    const dto = (await pipe.transform(body, { type: 'body', metatype })) as T;
    return { dto, messages: [] };
  } catch (error) {
    const response = (error as BadRequestException).getResponse() as {
      message: string[];
    };
    return { messages: response.message };
  }
}

const validRecipe = {
  name: '  Pasta con salsa  ',
  instructions: 'Hervir los fideos.',
  servings: 2,
  ingredients: [
    { product_id: P1, quantity: 200 },
    { product_id: P2, quantity: 0.5 },
  ],
};

describe('CreateRecipeDto', () => {
  it('acepta una receta válida, recorta el nombre y aplica porciones por defecto', async () => {
    const { dto, messages } = await validate(CreateRecipeDto, {
      name: '  Pasta con salsa  ',
      ingredients: [{ product_id: P1, quantity: 200 }],
    });

    expect(messages).toEqual([]);
    expect(dto?.name).toBe('Pasta con salsa');
    expect(dto?.servings).toBe(1);
  });

  it('acepta el ejemplo completo', async () => {
    expect((await validate(CreateRecipeDto, validRecipe)).messages).toEqual([]);
  });

  it.each([
    [{ ingredients: undefined }, 'ingredients debe ser una lista'],
    [{ ingredients: [] }, 'La receta debe tener al menos un ingrediente'],
    [
      {
        ingredients: [
          { product_id: P1, quantity: 1 },
          { product_id: P1, quantity: 2 },
        ],
      },
      'Un producto no puede repetirse en los ingredientes',
    ],
    [
      { ingredients: [{ product_id: P1, quantity: 0 }] },
      'ingredients.0.quantity debe ser mayor a 0',
    ],
    [
      { ingredients: [{ product_id: 'abc', quantity: 1 }] },
      'ingredients.0.product_id debe ser un UUID válido',
    ],
    [
      { ingredients: [{ product_id: P1, quantity: 1, extra: true }] },
      'ingredients.0.property extra should not exist',
    ],
    [{ servings: 0 }, 'Las porciones deben ser al menos 1'],
    [{ servings: 1.5 }, 'Las porciones deben ser un número entero'],
    [{ name: '' }, 'El nombre es obligatorio'],
  ])('rechaza %j', async (override, message) => {
    const { messages } = await validate(CreateRecipeDto, {
      ...validRecipe,
      ...override,
    });

    expect(messages).toEqual([message]);
  });

  it('rechaza más de 50 ingredientes', async () => {
    const ingredients = Array.from({ length: 51 }, (_, i) => ({
      product_id: `3f1c2b9e-8d4a-4f6b-9c2e-${String(i).padStart(12, '0')}`,
      quantity: 1,
    }));

    const { messages } = await validate(CreateRecipeDto, {
      ...validRecipe,
      ingredients,
    });

    expect(messages).toEqual([
      'La receta no puede tener más de 50 ingredientes',
    ]);
  });
});

describe('UpdateRecipeDto', () => {
  it('acepta un body vacío o parcial', async () => {
    expect((await validate(UpdateRecipeDto, {})).messages).toEqual([]);
    expect((await validate(UpdateRecipeDto, { servings: 4 })).messages).toEqual(
      [],
    );
  });

  it('permite borrar las instrucciones con null o texto vacío', async () => {
    const { dto } = await validate(UpdateRecipeDto, { instructions: '  ' });

    expect(dto?.instructions).toBeNull();
  });

  it.each([
    [{ name: null }, 'El nombre no puede estar vacío'],
    [{ servings: null }, 'Las porciones deben ser un número entero'],
    [{ ingredients: [] }, 'La receta debe tener al menos un ingrediente'],
    [{ ingredients: null }, 'ingredients debe ser una lista'],
  ])('rechaza %j', async (body, message) => {
    expect((await validate(UpdateRecipeDto, body)).messages).toEqual([message]);
  });
});
