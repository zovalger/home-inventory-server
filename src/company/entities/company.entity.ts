import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../auth/entities';
import { File } from '../../files/entities';
import { StatusObject } from 'src/common/interfaces';

@Entity('company')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: false })
  rif_prefix: string;

  @Column('text', { nullable: false })
  rif_number: string;

  @Column('text', { nullable: false })
  address: string;

  @Column('text', { nullable: false, default: StatusObject.active })
  status: StatusObject;

  @Column('text', { nullable: false })
  createById: string;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  createBy: User;

  @Column('text', { nullable: true })
  imageUrl: string;

  @ManyToOne(() => File, { cascade: true })
  @JoinColumn({ referencedColumnName: 'url' })
  image?: File;

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;
}
