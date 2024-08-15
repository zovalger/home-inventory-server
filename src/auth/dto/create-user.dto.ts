import { Transform, Type } from 'class-transformer';
import {
  IsString,
  MinLength,
  IsOptional,
  IsEmail,
  IsStrongPassword,
  // IsDateString,
  IsDate,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(1)
  lastName?: string;

  @IsEmail()
  @Transform(({ value }) => value.trim().toLocaleLowerCase())
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

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthday?: string;

  //todo: aceptar country
  // @IsInt()
  // country: number;
}
