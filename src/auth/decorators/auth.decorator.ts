import { UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { RoleProtected } from './role-protected.decorator';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';
import { ValidRoles } from '../interface/valid-roles';
import { UserVerifiedGuard } from '../guards/user-verified/user-verified.guard';
import { VerifiedUser } from './verified-user.decorator';
import { FamilyRoleGuard } from 'src/family/guards/family-role/family-role.guard';
import { FamilyRoles } from 'src/family/interfaces';
import { FamilyRoleProtected, MemberFamily } from 'src/family/decorators';

interface Params {
  roles?: ValidRoles[];
  withoutVerification?: boolean;

  familyRole?: FamilyRoles[];
  withoutFamilyMember?: boolean;
}

export const Auth = (params?: Params) => {
  const {
    roles = [],
    withoutVerification = false,
    familyRole = [],
    withoutFamilyMember = false,
  } = params || {};

  return applyDecorators(
    RoleProtected(...roles),
    VerifiedUser(withoutVerification),

    // family
    MemberFamily(withoutFamilyMember),
    FamilyRoleProtected(familyRole),

    UseGuards(AuthGuard(), UserRoleGuard, UserVerifiedGuard, FamilyRoleGuard),
  );
};
