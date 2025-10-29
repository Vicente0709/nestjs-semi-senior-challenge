import { Controller, Get, Post, UseGuards, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MessageDelivery } from '../db/entities/message-delivery.entity';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(
    @InjectRepository(MessageDelivery)
    private readonly repo: Repository<MessageDelivery>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los mensajes enviados' })
  findAll() {
    return this.repo.find();
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo envío de mensaje (simulado)' })
  create(@Body() dto: Partial<MessageDelivery>) {
    return this.repo.save({ ...dto, status: dto.status ?? 'QUEUED', sent_at: new Date() });
  }
}
