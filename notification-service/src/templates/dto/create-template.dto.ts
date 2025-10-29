import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({ example: 'login-sms', description: 'Nombre único de la plantilla' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'sms', enum: ['sms', 'whatsapp'] })
  @IsIn(['sms', 'whatsapp'])
  channel!: 'sms' | 'whatsapp';

  @ApiProperty({
    example: 'Login para user {{userId}} desde {{ip}} a las {{ts}}.',
    description: 'Cuerpo con placeholders {{...}}',
  })
  @IsString()
  @IsNotEmpty()
  body!: string;
}