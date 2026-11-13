import { IsNotEmpty, IsUUID } from 'class-validator';

/** POST /containers/:id/products (RF-06). */
export class AssignProductDto {
  @IsUUID('4', { message: 'product_id debe ser un UUID válido' })
  @IsNotEmpty({ message: 'product_id es obligatorio' })
  product_id!: string;
}
