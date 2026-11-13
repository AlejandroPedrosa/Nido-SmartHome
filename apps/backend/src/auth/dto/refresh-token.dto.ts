import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'El refresh token debe ser texto' })
  @IsNotEmpty({ message: 'El refresh token es obligatorio' })
  refresh_token!: string;
}
