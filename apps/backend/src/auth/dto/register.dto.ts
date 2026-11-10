import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// Los decoradores se evalúan de abajo hacia arriba (ver login.dto.ts).
export class RegisterDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @MaxLength(254, { message: 'El email es demasiado largo' })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email!: string;

  /** Mínimo de 6 caracteres: el mismo que exige Supabase Auth por defecto. */
  @MaxLength(72, { message: 'La contraseña es demasiado larga' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password!: string;
}
