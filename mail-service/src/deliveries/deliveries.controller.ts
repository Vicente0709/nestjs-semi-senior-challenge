import { Controller, Get, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EmailDelivery } from '../db/entities/email-delivery.entity';

type DeliveryStatus = 'QUEUED' | 'SENT' | 'FAILED';

@Controller('deliveries')
export class DeliveriesController {
  constructor(@InjectRepository(EmailDelivery) private readonly repo: Repository<EmailDelivery>) {}

  @Get()
  async list(
    @Query('page') page = '1',
    @Query('size') size = '20',
    @Query('status') status?: string,
  ) {
    const take = Math.min(Math.max(+size, 1), 100);
    const skip = (Math.max(+page, 1) - 1) * take;

    let where: FindOptionsWhere<EmailDelivery> | undefined = undefined;
    if (status && ['QUEUED', 'SENT', 'FAILED'].includes(status)) {
      where = { status: status as DeliveryStatus };
    }

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { created_at: 'DESC' },
      take,
      skip,
    });
    return { total, page: +page, size: take, items };
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.repo.findOneBy({ id });
  }
}