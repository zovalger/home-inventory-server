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
import { Family, FamilyMember } from 'src/family/entities';
import { FamilyRoles } from 'src/family/interfaces';
import { META_MEMBER_FAMILY } from 'src/family/decorators/member-family.decorator';

@Injectable()
export class FamilyRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,

    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,

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

    if (!user) throw new InternalServerErrorException(ResMessages.UserNotFound);

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

    if (!member) throw new ForbiddenException(ResMessages.familyNotFound);

    req['family'] = member.family;
    delete member.family;
    req['family_member'] = member;

    // tiene que ser miembro de la familia sin especificar rol
    if (!roles.length) return true;

    if (!roles.includes(member.role))
      throw new UnauthorizedException(ResMessages.UserUnauthorizedToFamily);

    return true;
  }
}
