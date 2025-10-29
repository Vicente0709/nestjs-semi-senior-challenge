import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { DataSource } from 'typeorm';
import { MessageTemplate } from '../db/entities/message-template.entity';
import { MessageDelivery } from '../db/entities/message-delivery.entity';


function render(tpl: string, data: Record<string, any>) {
  return tpl.replace(/{{(\w+)}}/g, (_, k) => (data?.[k] ?? ''));
}

@Injectable()
export class NotificationConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationConsumer.name);
  private consumer: Consumer | null = null;

  private readonly brokers = [process.env.KAFKA_BROKER || 'localhost:9092'];
  private readonly groupId = process.env.KAFKA_GROUP_ID_NOTIF || 'notification-service-group';
  private readonly topics = [
    process.env.AUTH_TOPIC || 'auth',
    process.env.TRANSACTIONS_TOPIC || 'transactions',
  ];

  constructor(@Inject(DataSource) private readonly ds: DataSource) {}

  async onModuleInit() {
    const kafka = new Kafka({ clientId: 'notification-service', brokers: this.brokers });
    this.consumer = kafka.consumer({ groupId: this.groupId });
    await this.consumer.connect();

    for (const t of this.topics) {
      await this.consumer.subscribe({ topic: t, fromBeginning: false });
    }

    await this.consumer.run({
      eachMessage: async ({ topic, message }: EachMessagePayload) => {
        const raw = message.value?.toString() ?? '';
        try {
          const evt = JSON.parse(raw);
          await this.routeEvent(topic, evt);
        } catch (e) {
          this.logger.error(`Invalid JSON: ${raw}`);
        }
      },
    });

    this.logger.log(`NotificationConsumer connected and subscribed to ${this.topics.join(', ')}`);
  }

  /**
   * Decide qué hacer con cada evento:
   * - OTP con canal (sms/whatsapp) -> notificación por el canal indicado.
   * - Transacciones -> SMS (transaction-sms).
   * - LOGIN sin canal -> se ignora aquí (lo maneja mail-service).
   */
  private async routeEvent(topic: string, evt: any) {
    if (evt?.event === 'OTP' && (evt?.channel === 'sms' || evt?.channel === 'whatsapp')) {
      await this.handleOtp(evt);
      return;
    }

    if (topic === (process.env.TRANSACTIONS_TOPIC || 'transactions')) {
      await this.handleTransaction(evt);
      return;
    }

    // LOGIN u otros eventos de auth sin canal: no es responsabilidad de notification-service
    // this.logger.debug(`Skipped event on topic=${topic}: ${evt?.event ?? 'unknown'} (no channel)`);
  }

  private async handleOtp(evt: any) {
    const channel: 'sms' | 'whatsapp' = evt.channel === 'whatsapp' ? 'whatsapp' : 'sms';
    const templates = this.ds.getRepository(MessageTemplate);
    const deliveries = this.ds.getRepository(MessageDelivery);

    const tplName = channel === 'whatsapp' ? 'otp-whatsapp' : 'otp-sms';
    const tpl = await templates.findOne({ where: { name: tplName } });
    if (!tpl) {
      this.logger.warn(`Template not found: ${tplName}`);
      return;
    }

    const body = render(tpl.body, evt);
    const recipient = evt?.phone
      ? (channel === 'whatsapp' ? `whatsapp:${evt.phone}` : `sms:${evt.phone}`)
      : (channel === 'whatsapp' ? 'whatsapp:+593000000000' : 'sms:+593000000000');

    const success = Math.random() > 0.05; // 95% éxito simulado
    await deliveries.save({
      template_id: tpl.id,
      recipient,
      payload: evt,
      status: success ? 'SENT' : 'FAILED',
      sent_at: success ? new Date() : null,
    });

    this.logger.log(`[NOTIF][OTP/${channel}] ${success ? 'SENT' : 'FAILED'} -> ${recipient} | "${body}"`);
  }

  private async handleTransaction(evt: any) {
    const templates = this.ds.getRepository(MessageTemplate);
    const deliveries = this.ds.getRepository(MessageDelivery);

    const tpl = await templates.findOne({ where: { name: 'transaction-sms' } });
    if (!tpl) {
      this.logger.warn('Template not found: transaction-sms');
      return;
    }

    const body = render(tpl.body, evt);
    const recipient = 'sms:+593000000000';

    const success = Math.random() > 0.05;
    await deliveries.save({
      template_id: tpl.id,
      recipient,
      payload: evt,
      status: success ? 'SENT' : 'FAILED',
      sent_at: success ? new Date() : null,
    });

    this.logger.log(`[NOTIF][TX/SMS] ${success ? 'SENT' : 'FAILED'} -> ${recipient} | "${body}"`);
  }

  async onModuleDestroy() {
    if (this.consumer) await this.consumer.disconnect();
  }
}