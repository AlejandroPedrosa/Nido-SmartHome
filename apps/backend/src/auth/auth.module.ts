import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { resolveFrontendUrl } from '../common/utils/frontend-url';
import type { EnvironmentVariables } from '../config/env.validation';
import { FRONTEND_URL } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: FRONTEND_URL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
        resolveFrontendUrl(
          config.get('FRONTEND_URL', { infer: true }),
          config.get('CORS_ORIGIN', { infer: true }),
        ),
    },
    SupabaseAuthGuard,
    // Guard global: todas las rutas exigen JWT salvo las marcadas @Public().
    { provide: APP_GUARD, useExisting: SupabaseAuthGuard },
  ],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
