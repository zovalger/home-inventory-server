import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Family } from './family.entity';
import { User } from 'src/auth/entities';
import { FamilyRoles } from '../interfaces';

@Entity('family_member')
export class FamilyMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  familyId: string;

  @Column('text', { nullable: false })
  userId: string;

  @ManyToOne(() => Family, (family) => family.members)
  family: Family;

  @ManyToOne(() => User, (user) => user.family)
  user: User;

  @Column('text', { nullable: false })
  role: FamilyRoles;
}
