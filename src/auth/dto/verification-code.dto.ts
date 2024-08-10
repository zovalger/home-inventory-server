import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class VerificationCodeDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(4)
  @MaxLength(4)
  code: string;
}
