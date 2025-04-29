import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('job_user') // 使用不同的表名
export class JobUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  username: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phoneNumber: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVip: boolean;

  @Column({ type: 'timestamp', nullable: true })
  vipExpireDate: Date;

  @Column({ default: 0 })
  uploadCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 