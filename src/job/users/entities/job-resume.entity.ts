import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { JobUser } from './user.entity';

@Entity('job_resume')
export class JobResume {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => JobUser)
  @JoinColumn({ name: 'userId' })
  user: JobUser;

  @Column({ type: 'text', nullable: true })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 