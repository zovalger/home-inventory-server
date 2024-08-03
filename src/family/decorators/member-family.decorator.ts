import { SetMetadata } from '@nestjs/common';

export const META_MEMBER_FAMILY = 'member_famiy';

export const MemberFamily = (arg: boolean) =>
  SetMetadata(META_MEMBER_FAMILY, arg);
