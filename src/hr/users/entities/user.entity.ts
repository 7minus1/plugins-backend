import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// @Entity('hr_user') // 添加表前缀hr_
@Entity('user') // 添加表前缀hr_
export class HrUser {
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