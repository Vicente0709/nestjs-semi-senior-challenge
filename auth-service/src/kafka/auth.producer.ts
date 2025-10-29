import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

/**
 * Publica:
 *  - LOGIN cada 8s (sin canal)
 *  - OTP cada 15s (con canal sms/whatsapp y phone aleatorio)
 */
@Injectable()
export class AuthProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthProducer.name);
  private producer: Producer | null = null;

  private loginTimer: NodeJS.Timeout | null = null;
  private otpTimer: NodeJS.Timeout | null = null;

  private readonly broker = process.env.KAFKA_BROKER || 'localhost:9092';
  private readonly topic = process.env.AUTH_TOPIC || 'auth';

  async onModuleInit() {
    const kafka = new Kafka({ brokers: [this.broker], clientId: 'auth-service' });
    this.producer = kafka.producer({ allowAutoTopicCreation: false });
    await this.producer.connect();
    this.logger.log(`Connected to Kafka broker ${this.broker} (topic "${this.topic}")`);

    // LOGIN cada 8s
    this.loginTimer = setInterval(() => {
      this.publishLoginEvent().catch((err) =>
        this.logger.error(`Failed to publish login event`, err.stack || err.message),
      );
    }, 8000);

    // OTP cada 15s con canal sms/whatsapp
    this.otpTimer = setInterval(() => {
      const channel: 'sms' | 'whatsapp' = Math.random() > 0.5 ? 'sms' : 'whatsapp';
      this.publishOtpEvent(channel).catch((err) =>
        this.logger.error(`Failed to publish OTP event`, err.stack || err.message),
      );
    }, 15000);
  }

  async onModuleDestroy() {
    if (this.loginTimer) clearInterval(this.loginTimer);
    if (this.otpTimer) clearInterval(this.otpTimer);
    if (this.producer) await this.producer.disconnect();
  }

  // ---------- LOGIN ----------
  private buildLoginEvent() {
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
    const evt = this.buildLoginEvent();
    await this.producer.send({
      topic: this.topic,
      messages: [{ key: String(evt.userId), value: JSON.stringify(evt) }],
    });
    this.logger.log(`Published LOGIN event for userId=${evt.userId}`);
  }

  // ---------- OTP ----------
  private randomEcuPhone(): string {
    // +5939xxxxxxxx (móvil de Ecuador, 9 dígitos tras el 9)
    const suffix = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
    return `+5939${suffix}`;
  }

  private buildOtpEvent(channel: 'sms' | 'whatsapp') {
    const userId = Math.floor(Math.random() * 10_000);
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
    const phone = this.randomEcuPhone();
    return {
      event: 'OTP',
      version: 1,
      userId,
      code,
      channel,     // sms | whatsapp
      phone,       // destino aleatorio
      ts: new Date().toISOString(),
      source: 'auth-service',
    };
  }

  async publishOtpEvent(channel: 'sms' | 'whatsapp' = 'sms') {
    if (!this.producer) return;
    const evt = this.buildOtpEvent(channel);
    await this.producer.send({
      topic: this.topic,
      messages: [{ key: String(evt.userId), value: JSON.stringify(evt) }],
    });
    this.logger.log(`Published OTP event for userId=${evt.userId} via ${channel} -> ${evt.phone}`);
  }
}