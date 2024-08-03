import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { File } from 'src/files/entities';
import { FamilyMember } from 'src/family/entities';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: true })
  lastName: string;

  @Column('text', { nullable: false, unique: true })
  email: string;

  @Column('text', { nullable: false, select: false })
  password: string;

  @Column('date', { nullable: true })
  birthday: string;

  @Column('bool', { default: true, nullable: false })
  isActive: boolean;

  @Column('bool', { default: false, nullable: false })
  isVerified: boolean;

  @Column('text', { array: true, default: ['user'] })
  roles: string[];

  @ManyToOne(() => FamilyMember, (familyMember) => familyMember.user)
  family: FamilyMember[];

  // @ManyToOne(() => Country, (country) => country.id, { eager: true })
  // country: Country;

  @OneToOne(() => File, { eager: true, cascade: true })
  @JoinColumn({
    name: 'image',
  })
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
