import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type DeliveryStatus = 'QUEUED' | 'SENT' | 'FAILED';

@Entity({ name: 'message_deliveries' })
export class MessageDelivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  template_id!: string;             // FK lógica

  @Column({ length: 64 })
  recipient!: string;               // sms:+593... | whatsapp:+593...

  @Column({ type: 'jsonb' })
  payload!: any;

  @Column({ type: 'varchar', length: 10 })
  status!: DeliveryStatus;

  @Column({ type: 'timestamptz', nullable: true })
  sent_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}