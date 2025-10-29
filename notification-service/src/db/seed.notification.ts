import { DataSource } from 'typeorm';
import { MessageTemplate } from './entities/message-template.entity';

export async function seedNotificationTemplates(ds: DataSource) {
  const repo = ds.getRepository(MessageTemplate);

  const desired = [
    {
      name: 'transaction-sms',
      channel: 'sms' as const,
      body: '{{event}} de {{amount}} {{currency}} en {{account}} a las {{ts}}.',
    },
    {
      name: 'otp-sms',
      channel: 'sms' as const,
      body: 'Tu código de seguridad es {{code}}. Usuario {{userId}}. {{ts}}',
    },
    {
      name: 'otp-whatsapp',
      channel: 'whatsapp' as const,
      body: 'Código OTP: *{{code}}*. Usuario {{userId}}. Fecha {{ts}}',
    },
  ];

  for (const tpl of desired) {
    const exists = await repo.findOne({ where: { name: tpl.name } });
    if (!exists) {
      await repo.save(repo.create(tpl));
      // eslint-disable-next-line no-console
      console.log(`[seed][notification] template created: ${tpl.name}`);
    }
  }
}