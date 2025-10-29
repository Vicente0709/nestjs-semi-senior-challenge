import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { typeOrmMailConfig } from './db/typeorm.config';
import { DataSource } from 'typeorm';
import { seedMailTemplates } from './db/seed.mail';
import { MailConsumer } from './kafka/mail.consumer';
import { TemplatesController } from './templates/templates.controller';
import { DeliveriesController } from './deliveries/deliveries.controller';
import { EmailTemplate } from './db/entities/email-template.entity';
import { EmailDelivery } from './db/entities/email-delivery.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmMailConfig),
    TypeOrmModule.forFeature([EmailTemplate, EmailDelivery]),
  ],
  controllers: [TemplatesController, DeliveriesController],
  providers: [MailConsumer],
})
export class AppModule implements OnModuleInit {
  constructor(@Inject(getDataSourceToken()) private readonly ds: DataSource) {}
  async onModuleInit() {
    await seedMailTemplates(this.ds);
  }
}