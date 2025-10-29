import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { typeOrmMailConfig } from './db/typeorm.config';
import { DataSource } from 'typeorm';

import { TemplatesController } from './templates/templates.controller';
import { MessagesController } from './message/messages.controller';
import { DeliveriesController } from './deliveries/deliveries.controller';


import { MailConsumer } from './kafka/mail.consumer';
import { EmailTemplate } from './db/entities/email-template.entity';
import { EmailDelivery } from './db/entities/email-delivery.entity';
import { MailSenderService } from './mailer/mailer.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmMailConfig),
    TypeOrmModule.forFeature([EmailTemplate, EmailDelivery]),
  ],
  controllers: [TemplatesController, MessagesController,DeliveriesController],
  providers: [MailConsumer, MailSenderService],
})
export class AppModule implements OnModuleInit {
  constructor(@Inject(getDataSourceToken()) private readonly ds: DataSource) {}

  async onModuleInit() {
    const repo = this.ds.getRepository(EmailTemplate);

    // login-email
    if (!(await repo.findOne({ where: { name: 'login-email' } }))) {
      await repo.save({
        name: 'login-email',
        subject: 'Nuevo inicio de sesión de {{userId}}',
        body: 'Acceso desde {{ip}} a las {{ts}}',
      });
    }

    // transaction-email
    if (!(await repo.findOne({ where: { name: 'transaction-email' } }))) {
      await repo.save({
        name: 'transaction-email',
        subject: 'Transacción {{event}} por {{amount}} {{currency}}',
        body: 'Cuenta {{account}} el {{ts}}',
      });
    }

    // opcional: otp-email (para disparar emails para OTP)
    // if (!(await repo.findOne({ where: { name: 'otp-email' } }))) {
    //   await repo.save({
    //     name: 'otp-email',
    //     subject: 'Tu código de seguridad es {{code}}',
    //     body: 'Código {{code}} generado el {{ts}} para el usuario {{userId}}',
    //   });
    // }
  }
}