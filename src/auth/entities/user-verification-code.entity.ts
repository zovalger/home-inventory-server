import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_verification_code')
export class UserVerificationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  code: string;

  @Column('timestamp', { nullable: false })
  expireIn: string;

  @Column('bool', { default: false, nullable: false })
  isUsed: boolean;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;
}
