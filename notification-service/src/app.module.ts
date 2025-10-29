import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { AppService } from './app.service';
import { typeOrmNotifConfig } from './db/typeorm.config';
import { seedNotificationTemplates } from './db/seed.notification';
import { NotificationConsumer } from './kafka/notification.consumer';

// Entidades
import { MessageTemplate } from './db/entities/message-template.entity';
import { MessageDelivery } from './db/entities/message-delivery.entity';

// Controladores (los que acabamos de crear)
import { TemplatesController } from './templates/templates.controller';
import { MessagesController } from './messages/messages.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmNotifConfig),
    TypeOrmModule.forFeature([MessageTemplate, MessageDelivery]),
  ],
  controllers: [TemplatesController, MessagesController],
  providers: [AppService, NotificationConsumer],
})
export class AppModule implements OnModuleInit {
  constructor(@Inject(getDataSourceToken()) private readonly ds: DataSource) {}

  async onModuleInit() {
    await seedNotificationTemplates(this.ds);
  }
}