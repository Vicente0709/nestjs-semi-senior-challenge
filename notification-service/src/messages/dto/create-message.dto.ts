import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'otp-sms' })
  @IsString() @IsNotEmpty()
  templateName!: string;

  @ApiProperty({ example: 'sms', enum: ['sms', 'whatsapp'] })
  @IsIn(['sms', 'whatsapp'])
  channel!: 'sms' | 'whatsapp';

  @ApiProperty({ example: '+593987654321', required: false })
  @IsOptional()
  @IsPhoneNumber('EC')
  to?: string;

  @ApiProperty({
    example: { userId: 1234, code: '384920', ts: '2025-10-29T03:30:00Z' },
    description: 'Datos para reemplazar {{...}} en la plantilla',
  })
  payload!: Record<string, any>;
}