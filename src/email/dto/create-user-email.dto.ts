import { User, UserVerificationCode } from '../../auth/entities';

export class CreateUserEmailDto {
  user: User;
  verificationCode: UserVerificationCode;
}
