import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { Unit } from '../common/enums/unit.enum';
import { PG_POOL, withTransaction } from '../database';
import { InventoryService, MovementType } from '../inventory';
import { RecipeIngredientDto } from './dto/recipe-ingredient.dto';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/recipe.dto';
import {
  AvailableRecipe,
  ConsumedIngredient,
  CookResult,
  MissingIngredient,
  RECIPE_SUMMARY_COLUMNS,
  RecipeDetail,
  RecipeIngredient,
  RecipeSummary,
} from './interfaces/recipe.interface';

interface LockedIngredient {
  product_id: string;
  product_name: string;
  unit: Unit;
  quantity: number;
  current_stock: number;
}

interface RecipeRow {
  id: string;
  name: string;
  instructions: string | null;
  servings: number;
  created_at: Date;
}

/** Campos de la receta editables por PATCH (los ingredientes van aparte). */
const UPDATABLE_FIELDS = ['name', 'instructions', 'servings'] as const;

/**
 * RF-09: recetas con ingredientes vinculados al inventario del usuario.
 * Un nombre duplicado (UG-01) lo traduce el filtro global a 409 a partir de
 * `uq_recipes_user_name_ci`.
 */
@Injectable()
export class RecipesService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * RF-11: prepara la receta descontando todos sus ingredientes en una única
   * transacción (RS-04), con bloqueo pesimista (RC-03, flujo 7.2):
   *
   * 1. Bloquea la receta (FOR SHARE) para que no cambien sus ingredientes
   *    mientras se cocina.
   * 2. Bloquea las filas de los productos (FOR UPDATE), ordenadas por id para
   *    que dos cocciones simultáneas no se bloqueen mutuamente (deadlock).
   * 3. Con las filas bloqueadas, verifica que alcance cada ingrediente; si
   *    falta alguno responde 400 con el detalle y no descuenta nada.
   * 4. Descuenta cada insumo con un movimiento `recipe_consumption` (RC-05)
   *    a través de InventoryService, en la misma transacción.
   */
  async cook(userId: string, recipeId: string): Promise<CookResult> {
    return withTransaction(this.pool, async (client) => {
      const recipe = await client.query<{ name: string }>(
        'SELECT name FROM recipes WHERE id = $1 AND user_id = $2 FOR SHARE',
        [recipeId, userId],
      );
      if (recipe.rows.length === 0) {
        throw new NotFoundException('Receta no encontrada');
      }
      const recipeName = recipe.rows[0].name;

      const { rows: ingredients } = await client.query<LockedIngredient>(
        `SELECT p.id AS product_id, p.name AS product_name, p.unit,
                ri.quantity, p.current_stock
           FROM recipe_ingredients ri
           JOIN products p ON p.id = ri.product_id
          WHERE ri.recipe_id = $1 AND p.user_id = $2
          ORDER BY p.id
            FOR UPDATE OF p`,
        [recipeId, userId],
      );

      const missing: MissingIngredient[] = ingredients
        .filter((i) => i.current_stock < i.quantity)
        .map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          unit: i.unit,
          required: i.quantity,
          available: i.current_stock,
        }));
      if (missing.length > 0) {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: `Stock insuficiente para cocinar "${recipeName}"`,
          missing,
        });
      }

      const consumed: ConsumedIngredient[] = [];
      for (const ingredient of ingredients) {
        const { current_stock } = await this.inventoryService.applyMovement(
          {
            userId,
            productId: ingredient.product_id,
            quantityChange: -ingredient.quantity,
            type: MovementType.RecipeConsumption,
            reason: `Receta: ${recipeName}`,
          },
          client,
        );
        consumed.push({
          product_id: ingredient.product_id,
          product_name: ingredient.product_name,
          unit: ingredient.unit,
          quantity: ingredient.quantity,
          current_stock,
        });
      }

      return { recipe_id: recipeId, recipe_name: recipeName, consumed };
    });
  }

  async findAll(userId: string): Promise<RecipeSummary[]> {
    const { rows } = await this.pool.query<RecipeSummary>(
      `SELECT ${RECIPE_SUMMARY_COLUMNS}
         FROM recipes r
        WHERE r.user_id = $1
        ORDER BY LOWER(r.name)`,
      [userId],
    );
    return rows;
  }

  /**
   * RF-10 / RC-04: recetas que se pueden cocinar ya, porque el stock cubre
   * la cantidad de todos sus ingredientes. Se resuelve en una sola consulta:
   * `bool_and` exige que ningún ingrediente falte. Incluye cuántas veces se
   * podría preparar (el ingrediente más escaso define el límite).
   */
  async findAvailable(userId: string): Promise<AvailableRecipe[]> {
    const { rows } = await this.pool.query<AvailableRecipe>(
      `SELECT ${RECIPE_SUMMARY_COLUMNS},
              FLOOR(MIN(p.current_stock / ri.quantity))::int AS times_available
         FROM recipes r
         JOIN recipe_ingredients ri ON ri.recipe_id = r.id
         JOIN products p ON p.id = ri.product_id AND p.user_id = r.user_id
        WHERE r.user_id = $1
        GROUP BY r.id
       HAVING bool_and(p.current_stock >= ri.quantity)
        ORDER BY LOWER(r.name)`,
      [userId],
    );
    return rows;
  }

  /** Detalle con ingredientes y disponibilidad (RC-04). 404 si es ajena. */
  async findOne(userId: string, recipeId: string): Promise<RecipeDetail> {
    const recipe = await this.pool.query<RecipeRow>(
      `SELECT id, name, instructions, servings, created_at
         FROM recipes WHERE id = $1 AND user_id = $2`,
      [recipeId, userId],
    );
    if (recipe.rows.length === 0) {
      throw new NotFoundException('Receta no encontrada');
    }

    const ingredients = await this.pool.query<RecipeIngredient>(
      `SELECT ri.product_id, p.name AS product_name, p.unit, ri.quantity,
              p.current_stock, p.current_stock >= ri.quantity AS available
         FROM recipe_ingredients ri
         JOIN products p ON p.id = ri.product_id
        WHERE ri.recipe_id = $1 AND p.user_id = $2
        ORDER BY LOWER(p.name)`,
      [recipeId, userId],
    );

    return {
      ...recipe.rows[0],
      ingredients: ingredients.rows,
      can_cook: ingredients.rows.every((ingredient) => ingredient.available),
    };
  }

  /**
   * RF-09: crea la receta y sus ingredientes en una transacción.
   * RC-01: todos los productos deben ser del usuario (404 si no).
   */
  async create(userId: string, dto: CreateRecipeDto): Promise<RecipeDetail> {
    const recipeId = await withTransaction(this.pool, async (client) => {
      await this.assertOwnProducts(client, userId, dto.ingredients);

      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO recipes (user_id, name, instructions, servings)
         VALUES ($1, $2, $3, $4)
      RETURNING id`,
        [userId, dto.name, dto.instructions ?? null, dto.servings ?? 1],
      );
      await this.insertIngredients(client, rows[0].id, dto.ingredients);
      return rows[0].id;
    });

    return this.findOne(userId, recipeId);
  }

  /**
   * RF-09: actualiza los campos enviados. Si llega `ingredients`, reemplaza
   * la lista completa dentro de la misma transacción.
   */
  async update(
    userId: string,
    recipeId: string,
    dto: UpdateRecipeDto,
  ): Promise<RecipeDetail> {
    await withTransaction(this.pool, async (client) => {
      const params: unknown[] = [recipeId, userId];
      const assignments = UPDATABLE_FIELDS.filter(
        (field) => dto[field] !== undefined,
      ).map((field) => {
        params.push(dto[field]);
        return `${field} = $${params.length}`;
      });

      // Sin campos para actualizar igual se ejecuta: verifica la pertenencia
      // y bloquea la receta mientras se reemplazan los ingredientes.
      const { rowCount } = await client.query(
        assignments.length > 0
          ? `UPDATE recipes SET ${assignments.join(', ')}
              WHERE id = $1 AND user_id = $2`
          : 'SELECT 1 FROM recipes WHERE id = $1 AND user_id = $2 FOR UPDATE',
        params,
      );
      if (rowCount === 0) {
        throw new NotFoundException('Receta no encontrada');
      }

      if (dto.ingredients) {
        await this.assertOwnProducts(client, userId, dto.ingredients);
        await client.query(
          'DELETE FROM recipe_ingredients WHERE recipe_id = $1',
          [recipeId],
        );
        await this.insertIngredients(client, recipeId, dto.ingredients);
      }
    });

    return this.findOne(userId, recipeId);
  }

  /** Elimina la receta; sus ingredientes se borran en cascada. */
  async remove(userId: string, recipeId: string): Promise<void> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM recipes WHERE id = $1 AND user_id = $2',
      [recipeId, userId],
    );
    if (rowCount === 0) {
      throw new NotFoundException('Receta no encontrada');
    }
  }

  /** RC-01: responde 404 si algún producto no existe o es de otro usuario. */
  private async assertOwnProducts(
    client: PoolClient,
    userId: string,
    ingredients: RecipeIngredientDto[],
  ): Promise<void> {
    const ids = ingredients.map((ingredient) => ingredient.product_id);
    const { rows } = await client.query<{ id: string }>(
      'SELECT id FROM products WHERE id = ANY($1::uuid[]) AND user_id = $2',
      [ids, userId],
    );
    if (rows.length !== ids.length) {
      throw new NotFoundException(
        'Uno o más ingredientes no corresponden a productos existentes',
      );
    }
  }

  private async insertIngredients(
    client: PoolClient,
    recipeId: string,
    ingredients: RecipeIngredientDto[],
  ): Promise<void> {
    await client.query(
      `INSERT INTO recipe_ingredients (recipe_id, product_id, quantity)
       SELECT $1, product_id, quantity
         FROM unnest($2::uuid[], $3::numeric[]) AS i(product_id, quantity)`,
      [
        recipeId,
        ingredients.map((ingredient) => ingredient.product_id),
        ingredients.map((ingredient) => ingredient.quantity),
      ],
    );
  }
}
