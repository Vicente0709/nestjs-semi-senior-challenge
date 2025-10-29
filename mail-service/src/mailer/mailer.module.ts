import { Module } from '@nestjs/common';
import { MailSenderService } from './mailer.service';

@Module({
  providers: [MailSenderService],
  exports: [MailSenderService],
})
export class AppMailerModule {}