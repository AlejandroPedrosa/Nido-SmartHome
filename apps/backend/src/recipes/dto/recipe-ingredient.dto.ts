import { IsNotEmpty, IsUUID } from 'class-validator';
import { IsQuantity } from '../../common/validators/quantity.decorators';

/**
 * Ingrediente de una receta: un producto propio (RC-01) y la cantidad que
 * consume, expresada en la unidad del producto (UN-02).
 */
export class RecipeIngredientDto {
  @IsUUID('4', { message: 'product_id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'product_id es obligatorio' })
  product_id!: string;

  @IsQuantity('quantity', { min: 'positive' })
  quantity!: number;
}
