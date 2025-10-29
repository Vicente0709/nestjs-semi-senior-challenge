import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EmailTemplate } from './entities/email-template.entity';
import { EmailDelivery } from './entities/email-delivery.entity';

export const typeOrmMailConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'postgres_mail',
  port: Number(process.env.DATABASE_PORT || 5432),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'mail_db',
  entities: [EmailTemplate, EmailDelivery],
  synchronize: true,
};