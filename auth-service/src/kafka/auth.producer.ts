import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
// Producer de eventos de LOGIN para el servicio de autenticación - Publisher cada 5s
@Injectable()
export class AuthProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthProducer.name);
  private producer: Producer | null = null;
  
  private timer: NodeJS.Timeout | null = null;

  private readonly broker = process.env.KAFKA_BROKER || 'localhost:9092';
  private readonly topic = process.env.AUTH_TOPIC || 'auth';

  async onModuleInit() {
    const kafka = new Kafka({
      brokers: [this.broker],
      clientId: 'auth-service',
    });

    this.producer = kafka.producer({ allowAutoTopicCreation: false });
    await this.producer.connect();
    this.logger.log(`Connected to Kafka broker ${this.broker} (topic "${this.topic}")`);

    // Publica un evento de LOGIN cada 8 segundos
    this.timer = setInterval(() => {
      this.publishLoginEvent().catch((err) => {
        this.logger.error(`Failed to publish login event`, err.stack || err.message);
      });
    }, 8000);
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
    const userId = Math.floor(Math.random() * 10_000);
    const ip = `203.0.113.${Math.floor(Math.random() * 254) + 1}`;
    return {
      event: 'LOGIN',
      version: 1,
      userId,
      ip,
      ts: new Date().toISOString(),
      source: 'auth-service',
    };
  }

  async publishLoginEvent() {
    if (!this.producer) return;

    const evt = this.buildEvent();

    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: String(evt.userId),       // afinidad por partición
          value: JSON.stringify(evt),
        },
      ],
    });

    this.logger.log(`Published LOGIN event for userId=${evt.userId}`);
  }
}