import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type MessageChannel = 'sms' | 'whatsapp';

@Entity({ name: 'message_templates' })
@Index(['name'], { unique: true })
export class MessageTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 80 })
  name!: string;                    // p.ej. 'transaction-sms' | 'otp-sms' | 'otp-whatsapp'

  @Column({ type: 'varchar', length: 16 })
  channel!: MessageChannel;         // 'sms' | 'whatsapp'

  @Column({ type: 'text' })
  body!: string;                    // permite {{placeholders}}

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}