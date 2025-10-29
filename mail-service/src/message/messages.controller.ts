import { Body, Controller, Get, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmailTemplate } from '../db/entities/email-template.entity';
import { EmailDelivery } from '../db/entities/email-delivery.entity';
import { SendMailDto } from './dto/send-mail.dto';
import { MailSenderService } from '../mailer/mailer.service';

function render(tpl: string, data: Record<string, any>) {
  return tpl.replace(/{{(\w+)}}/g, (_, k) => (data?.[k] ?? ''));
}

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(
    @InjectRepository(EmailTemplate) private readonly templates: Repository<EmailTemplate>,
    @InjectRepository(EmailDelivery) private readonly deliveries: Repository<EmailDelivery>,
    private readonly sender: MailSenderService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar las últimas entregas registradas' })
  @ApiOkResponse({ description: 'Listado de entregas' })
  list() {
    return this.deliveries.find({ order: { created_at: 'DESC' }, take: 100 });
  }

  @Post()
  @ApiOperation({
    summary: 'Renderizar y enviar (o simular) un correo basado en una plantilla',
    description:
      'Busca la plantilla por nombre, aplica payload a {{placeholders}}, intenta enviar por SMTP si ENABLE_SMTP=true; si no, simula. Persiste en email_deliveries.',
  })
  @ApiOkResponse({ description: 'Resultado del envío y registro de la entrega' })
  async send(@Body() dto: SendMailDto) {
    const tpl = await this.templates.findOne({ where: { name: dto.templateName } });
    if (!tpl) {
      return { ok: false, error: `Template not found: ${dto.templateName}` };
    }

    const payload = dto.payload || {};
    const subject = render(tpl.subject, payload);
    const body = render(tpl.body, payload);

    const enable = (process.env.ENABLE_SMTP || '').toLowerCase() === 'true';
    let ok = false;
    let error: string | null = null;

    if (enable) {
      try {
        ok = await this.sender.sendMail(dto.to, subject, body);
      } catch (e: any) {
        ok = false;
        error = e?.message || 'SMTP_SEND_FAILED';
      }
    } else {
      // Envío simulado si SMTP deshabilitado
      this.sender.debugQueue(dto.to, subject);
      ok = true;
    }

    const saved = await this.deliveries.save({
      template_id: tpl.id,
      recipient: dto.to,
      payload,
      status: ok ? 'SENT' : 'FAILED',
      sent_at: ok ? new Date() : null,
      error,
    });

    return { ok, subject, preview: body.slice(0, 120), delivery: saved };
  }
}