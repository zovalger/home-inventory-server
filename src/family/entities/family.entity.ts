import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
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

  @Column('text', { nullable: false })
  createById: string;

  @Column('text', { nullable: true })
  imageUrl: string;

  @ManyToOne(() => User, (user) => user.id, { nullable: false })
  createBy: User;

  @ManyToOne(() => File, { cascade: true })
  @JoinColumn({ referencedColumnName: 'url' })
  image?: File;

  @OneToMany(() => FamilyMember, (familyMember) => familyMember.family)
  members: FamilyMember[];

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;
}
