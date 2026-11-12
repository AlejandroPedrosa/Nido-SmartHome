import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from './auth';
import { PgExceptionFilter } from './common/filters/pg-exception.filter';
import { validateEnv } from './config';
import { ContainersModule } from './containers';
import { DatabaseModule } from './database';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory';
import { ProductsModule } from './products';
import { RecipesModule } from './recipes';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    InventoryModule,
    ProductsModule,
    ContainersModule,
    RecipesModule,
  ],
  controllers: [],
  providers: [{ provide: APP_FILTER, useClass: PgExceptionFilter }],
})
export class AppModule {}
