import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/auth/entities';
import { File } from 'src/files/entities';
import { FamilyMember } from './family-member.entity';

@Entity('family')
export class Family {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { default: 'free', nullable: false })
  tier: string;

  @Column('text', { nullable: false })
  name: string;

  @OneToOne(() => File, { eager: true, cascade: true })
  @JoinColumn({
    name: 'image',
  })
  image?: File;

  @OneToMany(() => FamilyMember, (familyMember) => familyMember.family)
  members: FamilyMember[];

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  createBy: User;

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;
}
