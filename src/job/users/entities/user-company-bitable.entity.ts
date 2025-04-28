import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { JobUser } from './user.entity';

@Entity('job_user_company_bitable')
export class JobUserCompanyBitable {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => JobUser)
  @JoinColumn()
  user: JobUser;

  @Column()
  userId: number;

  @Column()
  bitableUrl: string;

  @Column()
  bitableToken: string;

  @Column({ nullable: true, default: null })
  tableId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 