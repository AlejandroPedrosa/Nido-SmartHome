import { readFileSync } from 'node:fs';
import {
  Global,
  Inject,
  Logger,
  Module,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { EnvironmentVariables } from '../config';
import { PG_POOL, SUPABASE_CLIENT } from './database.constants';
import { createPgPool } from './pg-pool.factory';
import { createSupabaseClient } from './supabase-client.factory';

/**
 * Módulo global de acceso a PostgreSQL.
 * Expone un único pool `pg` compartido por todos los módulos (token PG_POOL)
 * y el cliente de Supabase para autenticación (token SUPABASE_CLIENT).
 */
@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>): Pool => {
        const caPath = config.get('DATABASE_SSL_CA_PATH', { infer: true });
        return createPgPool({
          connectionString: config.get('DATABASE_URL', { infer: true }),
          sslCa: caPath ? readFileSync(caPath, 'utf8') : undefined,
        });
      },
    },
    {
      provide: SUPABASE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
        createSupabaseClient({
          url: config.get('SUPABASE_URL', { infer: true }),
          publishableKey: config.get('SUPABASE_PUBLISHABLE_KEY', {
            infer: true,
          }),
        }),
    },
  ],
  exports: [PG_POOL, SUPABASE_CLIENT],
})
export class DatabaseModule
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /** Fail fast: si la base no responde, la API no queda levantada a medias. */
  async onApplicationBootstrap(): Promise<void> {
    await this.pool.query('SELECT 1');
    this.logger.log('Conexión a PostgreSQL verificada');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
    this.logger.log('Pool de PostgreSQL cerrado');
  }
}
