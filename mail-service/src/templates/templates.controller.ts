import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailTemplate } from '../db/entities/email-template.entity';

@Controller('templates')
export class TemplatesController {
  constructor(@InjectRepository(EmailTemplate) private readonly repo: Repository<EmailTemplate>) {}

  @Get()
  findAll() {
    return this.repo.find();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.repo.findOneBy({ id });
  }

  @Post()
  create(@Body() dto: Partial<EmailTemplate>) {
    return this.repo.save(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<EmailTemplate>) {
    return this.repo.save({ ...dto, id });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.repo.delete(id);
  }
}