import { DataSource } from 'typeorm';
import { MessageTemplate } from './entities/message-template.entity';

export async function seedNotificationTemplates(ds: DataSource) {
  const repo = ds.getRepository(MessageTemplate);
  const count = await repo.count();
  if (count > 0) return;

  await repo.save([
    {
      name: 'login-sms',
      body: 'Login para user {{userId}} desde {{ip}} a las {{ts}}.',
      channel: 'sms',
    },
    {
      name: 'transaction-sms',
      body: '{{event}} de {{amount}} {{currency}} en {{account}} a las {{ts}}.',
      channel: 'sms',
    },
  ]);
}