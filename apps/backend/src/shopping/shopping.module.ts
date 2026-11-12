import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory';
import { ShoppingController } from './shopping.controller';
import { ShoppingService } from './shopping.service';

@Module({
  imports: [InventoryModule],
  controllers: [ShoppingController],
  providers: [ShoppingService],
})
export class ShoppingModule {}
