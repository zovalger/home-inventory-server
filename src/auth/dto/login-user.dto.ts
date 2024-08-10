import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsStrongPassword } from 'class-validator';

export class LoginUserDto {
  @IsString()
  @Transform(({ value }) => value.trim().toLocaleLowerCase())
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;
}
