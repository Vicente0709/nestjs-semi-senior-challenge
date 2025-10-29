import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmailTemplate } from '../db/entities/email-template.entity';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(@InjectRepository(EmailTemplate) private readonly repo: Repository<EmailTemplate>) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las plantillas de correo' })
  @ApiOkResponse({ description: 'Listado de plantillas' })
  findAll() {
    return this.repo.find({ order: { updated_at: 'DESC' } });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una plantilla por ID' })
  @ApiOkResponse({ description: 'Plantilla encontrada' })
  findOne(@Param('id') id: string) {
    return this.repo.findOneBy({ id });
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva plantilla de correo' })
  @ApiOkResponse({ description: 'Plantilla creada' })
  create(@Body() dto: CreateEmailTemplateDto) {
    return this.repo.save(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una plantilla existente' })
  @ApiOkResponse({ description: 'Plantilla actualizada' })
  update(@Param('id') id: string, @Body() dto: UpdateEmailTemplateDto) {
    return this.repo.save({ ...dto, id });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una plantilla' })
  @ApiOkResponse({ description: 'Plantilla eliminada' })
  remove(@Param('id') id: string) {
    return this.repo.delete(id);
  }
}