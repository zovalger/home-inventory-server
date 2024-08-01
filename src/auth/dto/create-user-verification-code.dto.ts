import {} from 'class-validator';
import { User } from '../entities';

export class CreateUserVerificationCodeDto {
  user: User;
  code: string;
  expireIn: string;
}
