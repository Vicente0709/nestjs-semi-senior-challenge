import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionProducer } from './kafka/transaction.producer';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, TransactionProducer],
})
export class AppModule {}
