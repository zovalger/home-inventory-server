import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';

import { ResMessages } from 'src/config/res-messages';
import { FamilyMember } from '../entities';

export const GetUserFamilyMember = createParamDecorator(
  (
    // parametros al usar el decorador
    data: string,
    // contexto de la peticion
    ctx: ExecutionContext,
  ) => {
    const req = ctx.switchToHttp().getRequest();

    // registro de miembro familiar del usuario
    const member = req.family_member as FamilyMember;

    if (!member)
      throw new InternalServerErrorException(ResMessages.familyNotFound);

    const result = data ? member[data] : member;

    return result;
  },
);
