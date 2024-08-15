import { Reflector } from '@nestjs/core';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';

import { User } from '../../../auth/entities';

import { META_FAMILY_ROLES } from '../../decorators/family-role-protected.decorator';
import { FamilyMember } from '../../../family/entities';
import { FamilyRoles } from '../../../family/interfaces';
import { META_MEMBER_FAMILY } from '../../../family/decorators/member-family.decorator';

import { ResMessages } from '../../../common/providers';

@Injectable()
export class FamilyRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly resMessages: ResMessages,

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

    if (!user)
      throw new InternalServerErrorException(this.resMessages.userNotFound);

    return withoutFamilyMember || this.haveFamilyRole(req, user, familyRoles);
  }

  // ver si el usuario tiene el alguno de los roles requeridos
  async haveFamilyRole(
    req: Express.Request,
    user: User,
    roles: FamilyRoles[],
  ): Promise<boolean> {
    //  buscar el registro de miembro y los datos del grupo familiar
    const member = await this.familyMemberRepository.findOne({
      where: {
        userId: user.id,
      },
      relations: { family: true },
    });

    if (!member) throw new ForbiddenException(this.resMessages.familyNotFound);

    req['family'] = member.family;
    delete member.family;
    req['family_member'] = member;

    // tiene que ser miembro de la familia sin especificar rol
    if (!roles.length) return true;

    if (!roles.includes(member.role))
      throw new UnauthorizedException(
        this.resMessages.userUnauthorizedToFamily,
      );

    return true;
  }
}
