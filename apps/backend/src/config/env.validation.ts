import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Variables de entorno requeridas por la API.
 * Si alguna falta o es inválida, la aplicación no arranca (fail fast).
 */
export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  /** Connection string del Session pooler de Supabase (puerto 5432). */
  @Matches(/^postgres(ql)?:\/\/.+/, {
    message: 'DATABASE_URL debe ser una URL postgresql://',
  })
  DATABASE_URL!: string;

  /** URL base del proyecto, sin rutas (supabase-js agrega /auth/v1, etc.). */
  @IsUrl({ protocols: ['https', 'http'], require_tld: false })
  @Matches(/^https?:\/\/[^/]+\/?$/, {
    message: 'SUPABASE_URL debe ser la URL base del proyecto, sin rutas',
  })
  SUPABASE_URL!: string;

  /**
   * Publishable key de Supabase (pública, rol anon).
   * Se rechaza explícitamente una Secret key para no exponer acceso total.
   */
  @Matches(/^sb_publishable_\S+$/, {
    message: 'SUPABASE_PUBLISHABLE_KEY debe comenzar con sb_publishable_',
  })
  SUPABASE_PUBLISHABLE_KEY!: string;

  /** Uno o más orígenes permitidos, separados por coma. */
  @IsString()
  @IsNotEmpty()
  CORS_ORIGIN!: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((error) => {
        const messages = Object.values(error.constraints ?? {}).join(', ');
        return `  - ${error.property}: ${messages}`;
      })
      .join('\n');
    throw new Error(`Variables de entorno inválidas:\n${details}`);
  }

  return validated;
}
