import { IsBoolean, IsDefined } from 'class-validator';

/** PATCH /shopping/lists/:id/items/:productId (RF-13). */
export class SetItemPurchasedDto {
  @IsBoolean({ message: 'purchased debe ser true o false' })
  @IsDefined({ message: 'purchased es obligatorio' })
  purchased!: boolean;
}
