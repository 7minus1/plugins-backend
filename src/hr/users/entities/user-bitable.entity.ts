import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { HrUser } from './user.entity';

// @Entity('hr_user_bitable') // 添加表前缀hr_
@Entity('user_bitable') // 添加表前缀hr_
export class HrUserBitable {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => HrUser)
  @JoinColumn()
  user: HrUser;

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