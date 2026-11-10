import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { PgExceptionFilter } from './common/filters/pg-exception.filter';
import { validateEnv } from './config';
import { DatabaseModule } from './database';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    DatabaseModule,
    HealthModule,
  ],
  controllers: [],
  providers: [{ provide: APP_FILTER, useClass: PgExceptionFilter }],
})
export class AppModule {}
