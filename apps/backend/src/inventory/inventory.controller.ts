import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { InventoryService } from './inventory.service';
import {
  type ApplyMovementResult,
  MovementType,
} from './interfaces/movement.interface';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * RF-08 / RS-06: ajuste manual de stock (entrada o salida) con auditoría.
   * Rechaza con 400 si el stock resultante sería negativo.
   */
  @Post('adjust')
  @HttpCode(HttpStatus.CREATED)
  adjust(
    @CurrentUser('id') userId: string,
    @Body() dto: AdjustStockDto,
  ): Promise<ApplyMovementResult> {
    return this.inventoryService.applyMovement({
      userId,
      productId: dto.product_id,
      quantityChange: dto.quantity_change,
      type: MovementType.Manual,
      reason: dto.reason,
    });
  }
}
