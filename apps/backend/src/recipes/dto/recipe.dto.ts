import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Trim, TrimToNull } from '../../common/validators/transforms';
import { RecipeIngredientDto } from './recipe-ingredient.dto';

export const MAX_INGREDIENTS = 50;

/** Solo valida el campo si vino en el body (incluido `null`, que se rechaza). */
const IfPresent = () =>
  ValidateIf((_object: unknown, value: unknown) => value !== undefined);

const byProduct = (ingredient: RecipeIngredientDto) => ingredient?.product_id;

// Los decoradores se evalúan de abajo hacia arriba (ver login.dto.ts).

/** POST /recipes (RF-09). */
export class CreateRecipeDto {
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Trim()
  name!: string;

  @MaxLength(5000, {
    message: 'Las instrucciones no pueden superar 5000 caracteres',
  })
  @IsString({ message: 'Las instrucciones deben ser texto' })
  @IsOptional()
  @TrimToNull()
  instructions?: string | null;

  /** Informativo: cocinar descuenta las cantidades guardadas, no escala. */
  @Max(100, { message: 'Las porciones no pueden superar 100' })
  @Min(1, { message: 'Las porciones deben ser al menos 1' })
  @IsInt({ message: 'Las porciones deben ser un número entero' })
  @IsOptional()
  servings: number = 1;

  /** RC-02: al menos un ingrediente; RC-01 (pertenencia) se valida en el servicio. */
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  @ArrayUnique(byProduct, {
    message: 'Un producto no puede repetirse en los ingredientes',
  })
  @ArrayMaxSize(MAX_INGREDIENTS, {
    message: `La receta no puede tener más de ${MAX_INGREDIENTS} ingredientes`,
  })
  @ArrayMinSize(1, { message: 'La receta debe tener al menos un ingrediente' })
  @IsArray({ message: 'ingredients debe ser una lista' })
  ingredients!: RecipeIngredientDto[];
}

/**
 * PATCH /recipes/:id. Todos los campos son opcionales. Si se envía
 * `ingredients`, reemplaza la lista completa (y sigue exigiendo al menos uno).
 * `instructions` admite `null` para borrarlas.
 */
export class UpdateRecipeDto {
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @IfPresent()
  @Trim()
  name?: string;

  @MaxLength(5000, {
    message: 'Las instrucciones no pueden superar 5000 caracteres',
  })
  @IsString({ message: 'Las instrucciones deben ser texto' })
  @IsOptional()
  @TrimToNull()
  instructions?: string | null;

  @Max(100, { message: 'Las porciones no pueden superar 100' })
  @Min(1, { message: 'Las porciones deben ser al menos 1' })
  @IsInt({ message: 'Las porciones deben ser un número entero' })
  @IfPresent()
  servings?: number;

  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  @ArrayUnique(byProduct, {
    message: 'Un producto no puede repetirse en los ingredientes',
  })
  @ArrayMaxSize(MAX_INGREDIENTS, {
    message: `La receta no puede tener más de ${MAX_INGREDIENTS} ingredientes`,
  })
  @ArrayMinSize(1, { message: 'La receta debe tener al menos un ingrediente' })
  @IsArray({ message: 'ingredients debe ser una lista' })
  @IfPresent()
  ingredients?: RecipeIngredientDto[];
}
