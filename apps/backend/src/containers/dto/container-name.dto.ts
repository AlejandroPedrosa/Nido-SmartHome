import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../common/validators/transforms';

// Los decoradores se evalúan de abajo hacia arriba (ver login.dto.ts).

/** POST /containers. Nombre único por usuario, sin distinguir mayúsculas (UG-01). */
export class CreateContainerDto {
  @MaxLength(50, { message: 'El nombre no puede superar 50 caracteres' })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Trim()
  name!: string;
}

/** PATCH /containers/:id. El nombre es el único campo editable. */
export class UpdateContainerDto extends CreateContainerDto {}
