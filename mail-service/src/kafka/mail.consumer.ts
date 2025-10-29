import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { DataSource } from 'typeorm';
import { EmailTemplate } from '../db/entities/email-template.entity';
import { EmailDelivery } from '../db/entities/email-delivery.entity';
import { MailSenderService } from '../mailer/mailer.service';

const render = (tpl: string, data: Record<string, any>) =>
  tpl.replace(/{{(\w+)}}/g, (_, k) => (data?.[k] ?? ''));

@Injectable()
export class MailConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailConsumer.name);
  private consumer: Consumer | null = null;

  private readonly brokers = [process.env.KAFKA_BROKER || 'kafka:9092']; // <- default docker
  private readonly groupId = process.env.KAFKA_GROUP_ID_MAIL || 'mail-service-group';

  private readonly AUTH_TOPIC = process.env.AUTH_TOPIC || 'auth';
  private readonly TX_TOPIC = process.env.TRANSACTIONS_TOPIC || 'transactions';
  private readonly topics = [this.AUTH_TOPIC, this.TX_TOPIC];

  constructor(
    @Inject(DataSource) private readonly ds: DataSource,
    private readonly sender: MailSenderService
  ) {}

  async onModuleInit() {
    const kafka = new Kafka({ clientId: 'mail-service', brokers: this.brokers });
    this.consumer = kafka.consumer({ groupId: this.groupId });

    await this.consumer.connect();
    for (const t of this.topics) {
      await this.consumer.subscribe({ topic: t, fromBeginning: false });
    }

    await this.consumer.run({
      eachMessage: async ({ topic, message }: EachMessagePayload) => {
        const value = message.value?.toString() ?? '';
        try {
          const evt = JSON.parse(value);
          await this.handleEvent(topic, evt);
        } catch (err: any) {
          this.logger.error(`Invalid JSON received on ${topic}: ${value}`);
        }
      },
    });

    this.logger.log(
      `MailConsumer connected to ${this.brokers.join(', ')} and subscribed to ${this.topics.join(', ')}`
    );
  }

  private async handleEvent(topic: string, evt: any) {
    const templates = this.ds.getRepository(EmailTemplate);
    const deliveries = this.ds.getRepository(EmailDelivery);

    // Elegir plantilla y destinatario según el topic real
    const isAuth = topic === this.AUTH_TOPIC;
    const tplName = isAuth ? 'login-alert' : 'transaction-alert';
    const recipient = isAuth
      ? `user-${evt.userId ?? 'unknown'}@example.com`
      : 'owner@example.com';

    const tpl = await templates.findOne({ where: { name: tplName } });
    if (!tpl) {
      this.logger.warn(`Template not found: ${tplName}`);
      return;
    }

    const subject = render(tpl.subject, evt);
    const body = render(tpl.body, evt);

    // Enviar correo (si SMTP habilitado) y persistir resultado
    let sent = false;
    try {
      sent = await this.sender.sendMail(recipient, subject, body);
    } catch (err: any) {
      this.logger.error(`sendMail failed: ${err?.message || err}`);
    }

    try {
      await deliveries.save({
        template_id: tpl.id,
        recipient,
        payload: evt,
        status: sent ? 'SENT' : 'FAILED',
        sent_at: sent ? new Date() : null,
        error: sent ? null : 'SMTP_DISABLED_OR_FAILED',
      });
    } catch (err: any) {
      this.logger.error(`Failed to persist delivery: ${err?.message || err}`);
    }

    this.logger.log(`[MAIL] ${sent ? 'SENT' : 'QUEUED/FAILED'} -> ${recipient} | ${subject}`);
  }

  async onModuleDestroy() {
    if (this.consumer) await this.consumer.disconnect();
  }
}