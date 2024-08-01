import { UseGuards, applyDecorators } from '@nestjs/common';
import { RoleProtected } from './role-protected.decorator';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';
import { ValidRoles } from '../interface/valid-roles';
import { UserVerifiedGuard } from '../guards/user-verified/user-verified.guard';
import { VerifiedUser } from './verified-user.decorator';

interface params {
  roles?: ValidRoles[];
  withoutVerification?: boolean;
}

export const Auth = (params?: params) => {
  const { roles = [], withoutVerification = false } = params || {};

  return applyDecorators(
    RoleProtected(...roles),
    VerifiedUser(withoutVerification),
    UseGuards(AuthGuard(), UserRoleGuard, UserVerifiedGuard),
  );
};
