import {
  IsString,
  MinLength,
  IsOptional,
  IsEmail,
  IsStrongPassword,
  IsInt,
  IsPositive,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsStrongPassword(
    {},
    {
      message:
        'The password must contain at least 8 characters with at least one uppercase letter, one lowercase letter, one number and one special character.',
    },
  )
  password: string;

  @IsInt()
  @IsPositive()
  age: number;

  //todo: aceptar country
  // todo: aceptar imagen
}
