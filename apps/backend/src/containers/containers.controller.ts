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
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { uuidParam } from '../common/pipes/uuid-param.pipe';
import { ContainersService } from './containers.service';
import { AssignProductDto } from './dto/assign-product.dto';
import {
  CreateContainerDto,
  UpdateContainerDto,
} from './dto/container-name.dto';
import type {
  Container,
  ContainerDetail,
} from './interfaces/container.interface';

@Controller('containers')
export class ContainersController {
  constructor(private readonly containersService: ContainersService) {}

  /** Contenedores del usuario con la cantidad de productos asignados. */
  @Get()
  findAll(@CurrentUser('id') userId: string): Promise<Container[]> {
    return this.containersService.findAll(userId);
  }

  /** Contenedor con sus productos asignados (404 si es ajeno). */
  @Get(':id')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', uuidParam('id')) id: string,
  ): Promise<ContainerDetail> {
    return this.containersService.findOne(userId, id);
  }

  /** RF-06: asigna un producto propio. 409 si ya estaba asignado. */
  @Post(':id/products')
  @HttpCode(HttpStatus.CREATED)
  assignProduct(
    @CurrentUser('id') userId: string,
    @Param('id', uuidParam('id')) id: string,
    @Body() dto: AssignProductDto,
  ): Promise<ContainerDetail> {
    return this.containersService.assignProduct(userId, id, dto.product_id);
  }

  /** RF-06: desasigna el producto (el producto se conserva). */
  @Delete(':id/products/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  unassignProduct(
    @CurrentUser('id') userId: string,
    @Param('id', uuidParam('id')) id: string,
    @Param('productId', uuidParam('productId')) productId: string,
  ): Promise<void> {
    return this.containersService.unassignProduct(userId, id, productId);
  }

  /** RF-05: 409 si el nombre ya existe para el usuario (UG-01). */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateContainerDto,
  ): Promise<Container> {
    return this.containersService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', uuidParam('id')) id: string,
    @Body() dto: UpdateContainerDto,
  ): Promise<Container> {
    return this.containersService.update(userId, id, dto);
  }

  /** CT-03: los productos asignados se conservan; solo se quita el vínculo. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', uuidParam('id')) id: string,
  ): Promise<void> {
    return this.containersService.remove(userId, id);
  }
}
