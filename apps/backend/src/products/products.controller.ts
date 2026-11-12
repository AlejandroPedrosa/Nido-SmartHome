import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { uuidParam } from '../common/pipes/uuid-param.pipe';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import type {
  LowStockProduct,
  Product,
  ProductDetail,
} from './interfaces/product.interface';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * RF-07: listado con filtros opcionales (name, category, low_stock,
   * container_id). Cada producto incluye `containers: [{id, name}]` (PR-01).
   */
  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query() query: ProductQueryDto,
  ): Promise<ProductDetail[]> {
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

  /** RF-03: actualiza metadatos (no el stock). 409 si el nombre ya existe. */
  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', uuidParam('id')) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductDetail> {
    return this.productsService.update(userId, id, dto);
  }

  /** RF-03 / RC-06: elimina el producto; 409 si es ingrediente de recetas. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', uuidParam('id')) id: string,
  ): Promise<void> {
    return this.productsService.remove(userId, id);
  }
}
