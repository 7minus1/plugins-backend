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

@Entity('job_user_bitable')
export class JobUserBitable {
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
  companyTableId: string;

  @Column({ nullable: true, default: null })
  positionTableId: string;

  @Column({ nullable: true, default: null })
  resumeTableId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 