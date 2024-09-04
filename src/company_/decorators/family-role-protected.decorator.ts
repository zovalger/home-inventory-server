import { SetMetadata } from '@nestjs/common';
import { FamilyRoles } from '../interfaces';

export const META_FAMILY_ROLES = 'family_roles';

export const FamilyRoleProtected = (arg: FamilyRoles[]) =>
  SetMetadata(META_FAMILY_ROLES, arg);
