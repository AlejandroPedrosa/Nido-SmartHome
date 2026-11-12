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
import { CreateRecipeDto, UpdateRecipeDto } from './dto/recipe.dto';
import type {
  RecipeDetail,
  RecipeSummary,
} from './interfaces/recipe.interface';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string): Promise<RecipeSummary[]> {
    return this.recipesService.findAll(userId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', uuidParam('id')) id: string,
  ): Promise<RecipeDetail> {
    return this.recipesService.findOne(userId, id);
  }

  /** RF-09 / RC-01 / RC-02: al menos un ingrediente, todos productos propios. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRecipeDto,
  ): Promise<RecipeDetail> {
    return this.recipesService.create(userId, dto);
  }

  /** Actualiza la receta; `ingredients` reemplaza la lista completa. */
  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', uuidParam('id')) id: string,
    @Body() dto: UpdateRecipeDto,
  ): Promise<RecipeDetail> {
    return this.recipesService.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', uuidParam('id')) id: string,
  ): Promise<void> {
    return this.recipesService.remove(userId, id);
  }
}
