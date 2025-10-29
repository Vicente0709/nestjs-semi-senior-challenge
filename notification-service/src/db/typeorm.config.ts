import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { MessageTemplate } from './entities/message-template.entity';
import { MessageDelivery } from './entities/message-delivery.entity';

export const typeOrmNotifConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT || 5432),
  database: process.env.DATABASE_NAME || 'notifications_db',
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  entities: [MessageTemplate, MessageDelivery],
  synchronize: true, // SOLO DESARROLLO
};