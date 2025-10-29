import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Like, Repository } from 'typeorm';
import { EmailDelivery } from '../db/entities/email-delivery.entity';
import { QueryDeliveriesDto } from './dto/query-deliveries.dto';

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveriesController {
  constructor(@InjectRepository(EmailDelivery) private readonly repo: Repository<EmailDelivery>) {}

  @Get()
  @ApiOperation({ summary: 'Listar entregas con filtros y paginación' })
  @ApiOkResponse({ description: 'Listado paginado de entregas' })
  async list(@Query() q: QueryDeliveriesDto) {
    const where: any = {};
    if (q.status) where.status = q.status;
    if (q.recipient) where.recipient = Like(`%${q.recipient}%`);

    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 20;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    return {
      total,
      page,
      pageSize,
      items,
    };
  }
}