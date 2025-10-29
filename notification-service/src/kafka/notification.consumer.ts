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
  private readonly topics = [process.env.AUTH_TOPIC || 'auth', process.env.TRANSACTIONS_TOPIC || 'transactions'];

  constructor(@Inject(DataSource) private readonly ds: DataSource) {}

  async onModuleInit() {
    const kafka = new Kafka({ clientId: 'notification-service', brokers: this.brokers });
    this.consumer = kafka.consumer({ groupId: this.groupId });
    await this.consumer.connect();
    for (const t of this.topics) await this.consumer.subscribe({ topic: t, fromBeginning: false });
    await this.consumer.run({
      eachMessage: async ({ topic, message }: EachMessagePayload) => {
        const value = message.value?.toString() ?? '';
        try {
          const evt = JSON.parse(value);
          await this.handleEvent(topic, evt);
        } catch {
          this.logger.error(`Invalid JSON: ${value}`);
        }
      },
    });
    this.logger.log(`NotificationConsumer connected and subscribed to ${this.topics.join(', ')}`);
  }

  private async handleEvent(topic: string, evt: any) {
    const templates = this.ds.getRepository(MessageTemplate);
    const deliveries = this.ds.getRepository(MessageDelivery);

    const tplName = topic === 'auth' ? 'login-sms' : 'transaction-sms';
    const tpl = await templates.findOne({ where: { name: tplName } });
    if (!tpl) {
      this.logger.warn(`Template not found: ${tplName}`);
      return;
    }

    const body = render(tpl.body, evt);
    this.logger.log(`[NOTIF] Rendered="${body}"`);

    await deliveries.save({
      template_id: tpl.id,
      recipient: topic === 'auth' ? `+5930000000${String(evt.userId).slice(-2)}` : '+59300000000',
      payload: evt,
      status: 'QUEUED',
      sent_at: null,
    });
  }

  async onModuleDestroy() {
    if (this.consumer) await this.consumer.disconnect();
  }
}