import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'email_deliveries' })
export class EmailDelivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  template_id!: string;

  @Column()
  recipient!: string;

  @Column({ type: 'jsonb' })
  payload!: any;

  @Column({ type: 'varchar', length: 10 })
  status!: 'QUEUED' | 'SENT' | 'FAILED';

  @Column({ type: 'timestamptz', nullable: true })
  sent_at!: Date | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}