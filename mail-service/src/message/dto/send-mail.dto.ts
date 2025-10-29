import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class SendMailDto {
  @ApiProperty({ example: 'login-email', description: 'Nombre de la plantilla a usar' })
  @IsString()
  @IsNotEmpty()
  templateName!: string;

  @ApiProperty({ example: 'user@example.com', description: 'Destinatario del correo' })
  @IsEmail()
  to!: string;

  @ApiProperty({
    example: { userId: 1234, ip: '203.0.113.7', ts: '2025-10-29T10:10:00Z' },
    required: false,
    description: 'Datos para reemplazar placeholders {{...}} en subject/body',
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}