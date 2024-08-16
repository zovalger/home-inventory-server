import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class UpdateUserEmailDto {
  @IsEmail()
  @Transform(({ value }) => value.trim().toLocaleLowerCase())
  email: string;
}
