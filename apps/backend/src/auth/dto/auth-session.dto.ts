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
