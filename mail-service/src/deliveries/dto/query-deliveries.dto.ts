import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDeliveriesDto {
  @ApiPropertyOptional({ enum: ['QUEUED', 'SENT', 'FAILED'] })
  @IsOptional() @IsIn(['QUEUED', 'SENT', 'FAILED'])
  status?: 'QUEUED' | 'SENT' | 'FAILED';

  @ApiPropertyOptional({ description: 'Buscar por email del destinatario (contiene)' })
  @IsOptional() @IsString()
  recipient?: string;

  @ApiPropertyOptional({ description: 'Página (1..N)', default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Tamaño de página', default: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pageSize?: number = 20;
}
