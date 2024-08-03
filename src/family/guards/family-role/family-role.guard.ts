import { Reflector } from '@nestjs/core';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable } from 'rxjs';

import { User } from 'src/auth/entities';
import { ResMessages } from 'src/config/res-messages';
import { META_FAMILY_ROLES } from 'src/family/decorators/family-role-protected.decorator';
import { FamilyMember } from 'src/family/entities';
import { FamilyRoles } from 'src/family/interfaces';
import { META_MEMBER_FAMILY } from 'src/family/decorators/member-family.decorator';

@Injectable()
export class FamilyRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,

    @InjectRepository(FamilyMember)
    private readonly familyMemberRepository: Repository<FamilyMember>,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const withoutFamilyMember: boolean = this.reflector.get(
      META_MEMBER_FAMILY,
      context.getHandler(),
    );

    const familyRoles: FamilyRoles[] =
      this.reflector.get(META_FAMILY_ROLES, context.getHandler()) || [];

    const req = context.switchToHttp().getRequest();
    const user = req.user as User;
    const { id: familyId } = req.params;

    if (!user) throw new InternalServerErrorException(ResMessages.UserNotFound);

    return (
      withoutFamilyMember || this.haveFamilyRole(user, familyId, familyRoles)
    );
  }

  // ver si el usuario tiene el alguno de los roles requeridos
  async haveFamilyRole(
    user: User,
    familyId: string,
    roles: FamilyRoles[],
  ): Promise<boolean> {
    const member = await this.familyMemberRepository.findOneBy({
      familyId,
      userId: user.id,
    });

    if (!member)
      throw new ForbiddenException(ResMessages.UserForbiddenToFamily);

    // tiene que ser miembro de la familia sin especificar rol
    if (!roles.length) return true;

    if (!roles.includes(member.role))
      throw new UnauthorizedException(ResMessages.UserUnauthorizedToFamily);

    return true;
  }
}
