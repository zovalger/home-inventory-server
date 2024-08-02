import { User } from 'src/auth/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'files' })
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  type: string; // pdf, image, audio, video

  @Column('text', { nullable: false, unique: true })
  serviceId: string;

  @Column('text', { nullable: false, unique: true })
  url: string;

  @ManyToOne(() => User, (user) => user.id)
  createBy: string;

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;
}
