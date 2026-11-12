import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { PG_POOL, withTransaction } from '../database';
import { RecipeIngredientDto } from './dto/recipe-ingredient.dto';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/recipe.dto';
import {
  AvailableRecipe,
  RECIPE_SUMMARY_COLUMNS,
  RecipeDetail,
  RecipeIngredient,
  RecipeSummary,
} from './interfaces/recipe.interface';

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
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

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
