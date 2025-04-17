import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Resume {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column('jsonb')
  education: {
    school: string;
    degree: string;
    major: string;
    duration: string;
  }[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}