export { AuthModule } from './auth.module';
export { CurrentUser } from './decorators/current-user.decorator';
export { IS_PUBLIC_KEY, Public } from './decorators/public.decorator';
export { SupabaseAuthGuard } from './guards/supabase-auth.guard';
export type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from './interfaces/authenticated-user.interface';
