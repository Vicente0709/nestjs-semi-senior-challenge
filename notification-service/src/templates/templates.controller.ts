import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { MessageTemplate } from '../db/entities/message-template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(
    @InjectRepository(MessageTemplate)
    private readonly repo: Repository<MessageTemplate>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las plantillas de notificación' })
  @ApiOkResponse({ description: 'Listado de plantillas' })
  findAll() {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una plantilla por ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiOkResponse({ description: 'Plantilla encontrada' })
  findOne(@Param('id') id: string) {
    return this.repo.findOneBy({ id });
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva plantilla de notificación' })
  @ApiCreatedResponse({ description: 'Plantilla creada' })
  create(@Body() dto: CreateTemplateDto) {
    return this.repo.save(dto as any);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una plantilla existente' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiOkResponse({ description: 'Plantilla actualizada' })
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.repo.save({ ...dto, id } as any);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una plantilla' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiOkResponse({ description: 'Plantilla eliminada' })
  remove(@Param('id') id: string) {
    return this.repo.delete(id);
  }
}