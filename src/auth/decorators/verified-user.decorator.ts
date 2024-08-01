import { SetMetadata } from '@nestjs/common';

export const META_WITHOUTVERIFIED = 'withVerified';

export const VerifiedUser = (withoutVerified: boolean) =>
  SetMetadata(META_WITHOUTVERIFIED, withoutVerified);
