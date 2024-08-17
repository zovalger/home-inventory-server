import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_WITHOUTVERIFIED } from '../../decorators/verified-user.decorator';
import { User } from '../../entities';
import { ResMessages } from '../../../common/providers';

@Injectable()
export class UserVerifiedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const withoutVerified: boolean = this.reflector.get(
      META_WITHOUTVERIFIED,
      context.getHandler(),
    );

    const req = context.switchToHttp().getRequest();

    const user = req.user as User;

    if (!user) throw new BadRequestException(ResMessages.userNotFound);

    if (!withoutVerified && !user.isVerified)
      throw new UnauthorizedException(ResMessages.userNotVerify);

    return true;
  }
}
