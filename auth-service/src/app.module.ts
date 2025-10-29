import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthProducer } from './kafka/auth.producer';


@Module({
  imports: [],
  controllers: [],
  providers: [AppService, AuthProducer],
})
export class AppModule {}
