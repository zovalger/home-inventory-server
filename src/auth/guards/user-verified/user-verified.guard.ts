import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_WITHOUTVERIFIED } from 'src/auth/decorators/verified-user.decorator';
import { User } from 'src/auth/entities';

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

    if (!user) throw new BadRequestException('User not found');

    if (!withoutVerified && !user.isVerified)
      throw new ForbiddenException(`User isn't verified`);

    return true;
  }
}
