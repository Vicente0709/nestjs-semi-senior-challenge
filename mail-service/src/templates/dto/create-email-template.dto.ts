import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEmailTemplateDto {
  @ApiProperty({ example: 'login-email', description: 'Nombre único de la plantilla' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Nuevo inicio de sesión de {{userId}}' })
  @IsString() @IsNotEmpty()
  subject!: string;

  @ApiProperty({ example: 'Acceso desde {{ip}} a las {{ts}}' })
  @IsString() @IsNotEmpty()
  body!: string;
}