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
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import type {
  LowStockProduct,
  Product,
  ProductDetail,
} from './interfaces/product.interface';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** RF-07: listado con filtros opcionales (name, category, low_stock, container_id). */
  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query() query: ProductQueryDto,
  ): Promise<Product[]> {
    return this.productsService.findAll(userId, query);
  }

  /**
   * RS-01: productos bajo mínimo con cantidad sugerida.
   * Declarada antes de `:id` para que "low-stock" no se tome como id.
   */
  @Get('low-stock')
  findLowStock(@CurrentUser('id') userId: string): Promise<LowStockProduct[]> {
    return this.productsService.findLowStock(userId);
  }

  /**
   * RF-03: crea un producto. Si current_stock > 0 registra el movimiento
   * inicial en la misma transacción. 409 si el nombre ya existe (UG-01).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProductDto,
  ): Promise<Product> {
    return this.productsService.create(userId, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', uuidParam('id')) id: string,
  ): Promise<ProductDetail> {
    return this.productsService.findOne(userId, id);
  }
}
