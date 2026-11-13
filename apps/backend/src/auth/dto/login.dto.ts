import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Los decoradores de class-validator se evalúan de abajo hacia arriba: el más
// cercano a la propiedad es la primera validación (y, con stopAtFirstError,
// el único mensaje que se devuelve).
export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @MaxLength(254, { message: 'El email es demasiado largo' })
  @IsEmail({}, { message: 'El email no es válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email!: string;

  @MaxLength(72, { message: 'La contraseña es demasiado larga' })
  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password!: string;
}
