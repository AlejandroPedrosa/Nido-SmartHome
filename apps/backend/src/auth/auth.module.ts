import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    SupabaseAuthGuard,
    // Guard global: todas las rutas exigen JWT salvo las marcadas @Public().
    { provide: APP_GUARD, useExisting: SupabaseAuthGuard },
  ],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
