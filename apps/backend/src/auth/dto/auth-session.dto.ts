/** Sesión devuelta por login, refresh y register (contrato con el frontend). */
export interface AuthSessionDto {
  access_token: string;
  refresh_token: string;
  token_type: string;
  /** Segundos de vida del access token (AT-01: 1 hora por defecto). */
  expires_in: number;
  /** Instante de expiración en segundos Unix. */
  expires_at: number | null;
  user: AuthUserDto;
}

export interface AuthUserDto {
  id: string;
  email: string | null;
}

/** Respuesta de POST /auth/register. */
export interface RegisterResponseDto {
  user: AuthUserDto;
  /**
   * Sesión iniciada. Es `null` si el proyecto de Supabase exige confirmar el
   * email: el usuario debe confirmarlo y luego hacer login.
   */
  session: AuthSessionDto | null;
  email_confirmation_required: boolean;
}
