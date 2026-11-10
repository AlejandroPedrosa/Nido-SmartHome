import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { parseCorsOrigins } from './common/utils/parse-cors-origins';
import { EnvironmentVariables } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<EnvironmentVariables, true>);

  // Validación global de DTOs: descarta campos no declarados, rechaza los
  // desconocidos con 400 y transforma el payload a instancias tipadas.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // El frontend envía el JWT en el header Authorization (sin cookies).
  app.enableCors({
    origin: parseCorsOrigins(config.get('CORS_ORIGIN', { infer: true })),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Permite cerrar recursos (p. ej. el pool de PostgreSQL) al detener el proceso.
  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`API escuchando en el puerto ${port}`, 'Bootstrap');
}
void bootstrap();
