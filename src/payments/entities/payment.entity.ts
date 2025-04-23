import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: number;

  @Column()
  orderNo: string;

  @Column()
  amount: number;

  @Column()
  status: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ type: 'json', nullable: true })
  paymentResult: any;

  @CreateDateColumn()
  createdAt: Date;
}
