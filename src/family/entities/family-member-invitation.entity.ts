import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Family } from './family.entity';
import { FamilyRoles } from '../interfaces';
import { FamilyMemberInvitationStatus } from '../interfaces/family-member-invitation-status.interfaces';
import { User } from 'src/auth/entities';

@Entity('family_member_invitation')
export class FamilyMemberInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: false })
  familyId: string;

  @ManyToOne(() => Family)
  family: Family;

  @Column('text', { nullable: false })
  guestEmail: string;

  @Column('text', { nullable: false, default: FamilyRoles.adult })
  role: FamilyRoles;

  @Column('text', {
    nullable: false,
    default: FamilyMemberInvitationStatus.pending,
  })
  status: FamilyMemberInvitationStatus; // pending | acepted | rejected

  @Column('text', { nullable: false })
  createById: string;

  @ManyToOne(() => User)
  createBy: User;

  @CreateDateColumn()
  createAt: string;

  @UpdateDateColumn()
  updateAt: string;
}
