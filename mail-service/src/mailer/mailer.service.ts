import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailSenderService {
  private readonly logger = new Logger(MailSenderService.name);
  private readonly enableSmtp: boolean;
  private readonly defaultFrom: string;
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.enableSmtp = (process.env.ENABLE_SMTP || '').toLowerCase() === 'true';
    this.defaultFrom = process.env.DEFAULT_FROM || 'no-reply@example.com';

    if (this.enableSmtp) {
      const host = process.env.SMTP_HOST || 'localhost';
      const port = Number(process.env.SMTP_PORT || 1025);
      const user = process.env.SMTP_USER || undefined;
      const pass = process.env.SMTP_PASS || undefined;

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
        auth: user && pass ? { user, pass } : undefined,
      });

      this.logger.log(`SMTP habilitado: ${host}:${port} (auth=${!!(user && pass)})`);
    } else {
      this.logger.warn('SMTP deshabilitado: se simularán los envíos (cola/DEBUG).');
    }
  }

  /**
   * Envío real si ENABLE_SMTP=true, de lo contrario simula y retorna true.
   */
  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.enableSmtp || !this.transporter) {
      this.logger.debug(`[SIMULATED SEND] to=${to} | subject="${subject}"`);
      return true; // simulación exitosa
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.defaultFrom,
        to,
        subject,
        html,
      });
      this.logger.log(`Email enviado (messageId=${info.messageId}) a ${to} | subject="${subject}"`);
      return true;
    } catch (err: any) {
      this.logger.error(`Fallo al enviar email: ${err?.message || err}`);
      return false;
    }
  }

  /**
   * Útil cuando SMTP está deshabilitado: simula "en cola".
   */
  debugQueue(to: string, subject: string) {
    this.logger.debug(`[QUEUE] ${to}: ${subject}`);
  }
}