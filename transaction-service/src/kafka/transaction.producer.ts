import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

type EventType = 'DEPOSIT' | 'WITHDRAWAL';

@Injectable()
export class TransactionProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TransactionProducer.name);
  private producer: Producer | null = null;
  private timer: NodeJS.Timeout | null = null;

  private readonly broker = process.env.KAFKA_BROKER || 'localhost:9092';
  private readonly topic = process.env.TRANSACTIONS_TOPIC || 'transactions';

  async onModuleInit() {
    const kafka = new Kafka({
      brokers: [this.broker],
      clientId: 'transaction-service',
    });

    this.producer = kafka.producer({ allowAutoTopicCreation: false });
    await this.producer.connect();
    this.logger.log(`Connected to Kafka broker ${this.broker} (topic "${this.topic}")`);

    // Publica una transacción cada 5 segundos
    this.timer = setInterval(() => {
      this.publishTransactionEvent().catch((err) => {
        this.logger.error(`Failed to publish transaction event`, err.stack || err.message);
      });
    }, 5000);
  }

  async onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
    }
  }

  private buildEvent() {
    const type: EventType = Math.random() > 0.5 ? 'DEPOSIT' : 'WITHDRAWAL';
    const account = `ACC-${Math.floor(Math.random() * 900000 + 100000)}`; // ACC-###### aleatorio
    const amount = Number((Math.random() * 500 + 10).toFixed(2)); // 10.00 - 510.00

    return {
      event: type,
      version: 1,
      account,
      amount,
      currency: 'USD',
      ts: new Date().toISOString(),
      source: 'transaction-service',
    };
  }

  async publishTransactionEvent() {
    if (!this.producer) return;

    const evt = this.buildEvent();

    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: evt.account,               // afinidad por partición
          value: JSON.stringify(evt),
        },
      ],
    });

    this.logger.log(`Published ${evt.event} ${evt.amount} ${evt.currency} for ${evt.account}`);
  }
}