import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { File } from '../../files/entities';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false, default: 'basic' })
  subcription: string;

  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: false, default: '' })
  lastName: string;

  @Column('text', { nullable: false, unique: true })
  email: string;

  @Column('text', { nullable: false, select: false })
  password: string;

  @Column('timestamp with time zone', { nullable: true })
  birthday: string;

  @Column('bool', { default: true, nullable: false })
  isActive: boolean;

  @Column('bool', { default: false, nullable: false })
  isVerified: boolean;

  @Column('text', { array: true, default: ['user'] })
  roles: string[];

  @Column('text', { nullable: true })
  imageUrl: string;

  @Column('text', { nullable: false, default: '' })
  address: string;

  @Column('text', { nullable: false, default: '' })
  country: string;

  @Column('text', { nullable: false, default: '' })
  phoneNumber: string;

  @ManyToOne(() => File)
  @JoinColumn({ referencedColumnName: 'url' })
  image: File;

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;

  @BeforeInsert()
  lowerCaseEmail() {
    this.email = this.email.toLocaleLowerCase();
  }
}
