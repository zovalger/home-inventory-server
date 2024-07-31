import { UserVerificationCode } from 'src/auth/entities';
import { User } from 'src/auth/entities/user.entity';

export class CreateUserEmailDto {
  user: User;
  verificationCode: UserVerificationCode;
}
