import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';

import { ResMessages } from 'src/common/res-messages/res-messages';
import { Family } from '../entities';

export const GetUserFamily = createParamDecorator(
  (
    // parametros al usar el decorador
    data: string,
    // contexto de la peticion
    ctx: ExecutionContext,
  ) => {
    const req = ctx.switchToHttp().getRequest();

    // familia del usuario
    const family = req.family as Family;

    if (!family)
      throw new InternalServerErrorException(ResMessages.familyNotFound);

    const result = data ? family[data] : family;

    return result;
  },
);
