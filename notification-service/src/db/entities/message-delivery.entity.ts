import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { MessageTemplate } from './message-template.entity';

@Entity({ name: 'message_deliveries' })
export class MessageDelivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MessageTemplate, { eager: true })
  @JoinColumn({ name: 'template_id' })
  template: MessageTemplate;

  @Column({ type: 'uuid' })
  template_id: string;

  @Column({ length: 60 })
  recipient: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ length: 20, default: 'QUEUED' })
  status: 'QUEUED' | 'SENT' | 'FAILED';

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sent_at: Date | null;
}