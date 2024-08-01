import { IsEmail, IsStrongPassword } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;
}
