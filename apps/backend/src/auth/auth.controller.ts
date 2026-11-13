import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import type {
  AuthSessionDto,
  AuthUserDto,
  RegisterResponseDto,
} from './dto/auth-session.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** RF-01: registra al usuario y crea sus contenedores por defecto. */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(dto);
  }

  /** RF-02: inicia sesión y devuelve access token + refresh token. */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthSessionDto> {
    return this.authService.login(dto);
  }

  /** AT-02: renueva el access token con el refresh token vigente. */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthSessionDto> {
    return this.authService.refresh(dto.refresh_token);
  }

  /** RF-02: cierra la sesión actual e invalida sus tokens. */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser('accessToken') accessToken: string): Promise<void> {
    return this.authService.logout(accessToken);
  }

  /** Datos del usuario autenticado. */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): AuthUserDto {
    return this.authService.me(user);
  }
}
