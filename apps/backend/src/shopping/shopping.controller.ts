import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { uuidParam } from '../common/pipes/uuid-param.pipe';
import type {
  ShoppingListDetail,
  ShoppingListSummary,
} from './interfaces/shopping-list.interface';
import { ShoppingService } from './shopping.service';

@Controller('shopping/lists')
export class ShoppingController {
  constructor(private readonly shoppingService: ShoppingService) {}

  /** Historial de listas del usuario (la activa primero). */
  @Get()
  findAll(@CurrentUser('id') userId: string): Promise<ShoppingListSummary[]> {
    return this.shoppingService.findAll(userId);
  }

  /** Lista con sus ítems (404 si es ajena). */
  @Get(':id')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', uuidParam('id')) id: string,
  ): Promise<ShoppingListDetail> {
    return this.shoppingService.findOne(userId, id);
  }
}
