import { DataSource } from 'typeorm';
import { EmailTemplate } from './entities/email-template.entity';

export async function seedMailTemplates(ds: DataSource) {
  const repo = ds.getRepository(EmailTemplate);

  const seeds = [
    {
      name: 'login-alert',
      subject: 'Nuevo inicio de sesión de {{userId}}',
      body: 'Usuario {{userId}} inició sesión desde IP {{ip}} a las {{ts}}',
    },
    {
      name: 'transaction-alert',
      subject: 'Transacción {{event}} por {{amount}}',
      body: 'Cuenta {{accountId}} realizó {{event}} por {{amount}} a las {{ts}}',
    },
  ];

  for (const s of seeds) {
    const exists = await repo.findOne({ where: { name: s.name } });
    if (!exists) await repo.save(s);
  }
}