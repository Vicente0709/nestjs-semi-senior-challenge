import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';
import { typeOrmNotifConfig } from './db/typeorm.config';
import { seedNotificationTemplates } from './db/seed.notification';
import { NotificationConsumer } from './kafka/notification.consumer';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmNotifConfig)],
  controllers: [],
  providers: [AppService, NotificationConsumer],
})
export class AppModule implements OnModuleInit {
  constructor(@Inject(getDataSourceToken()) private readonly ds: DataSource) {}
  async onModuleInit() {
    await seedNotificationTemplates(this.ds);
  }
}