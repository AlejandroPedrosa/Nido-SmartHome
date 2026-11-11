import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { uuidParam } from '../common/pipes/uuid-param.pipe';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { MovementQueryDto, PaginationQueryDto } from './dto/movement-query.dto';
import { InventoryService } from './inventory.service';
import {
  type ApplyMovementResult,
  type MovementHistoryItem,
  MovementType,
} from './interfaces/movement.interface';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * CU-06: historial de movimientos del usuario.
   * Filtros opcionales: product_id, type, from, to; paginación limit/offset.
   */
  @Get('movements')
  findMovements(
    @CurrentUser('id') userId: string,
    @Query() query: MovementQueryDto,
  ): Promise<MovementHistoryItem[]> {
    return this.inventoryService.findMovements(userId, {
      productId: query.product_id,
      type: query.type,
      from: query.from,
      to: query.to,
      limit: query.limit,
      offset: query.offset,
    });
  }

  /** Historial de auditoría de un producto (404 si no es del usuario). */
  @Get('movements/:productId')
  findProductMovements(
    @CurrentUser('id') userId: string,
    @Param('productId', uuidParam('productId')) productId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<MovementHistoryItem[]> {
    return this.inventoryService.findProductMovements(userId, productId, {
      limit: query.limit,
      offset: query.offset,
    });
  }

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
