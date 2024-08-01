import {
  ExecutionContext,
  InternalServerErrorException,
  createParamDecorator,
} from '@nestjs/common';

export const GetUser = createParamDecorator(
  (
    // parametros al usar el decorador
    data: string,
    // contexto de la peticion
    ctx: ExecutionContext,
  ) => {
    const req = ctx.switchToHttp().getRequest();

    const user = req.user;

    if (!user) throw new InternalServerErrorException('user not found request');

    const result = data ? user[data] : user;

    return result;
  },
);
