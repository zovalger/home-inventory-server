import { User } from 'src/auth/entities';
import { Family, FamilyMember } from '../../family/entities';

export interface AllUserData {
  user: User;
  userFamily: Family;
  userFamilyMember: FamilyMember;
}
